// A small, robust JSON HTTP client on top of the built-in fetch.
// Remote calls fail in many ways: slow, down, overloaded, rate-limited. Plan for all of them.
import { setTimeout as sleep } from 'node:timers/promises';

export class HttpError extends Error {
  constructor(status, body, url) {
    super(`HTTP ${status} from ${url}`);
    this.status = status;
    this.body = body;
  }
}

export class TimeoutError extends Error {}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const IDEMPOTENT = new Set(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']);

export function createHttpClient({ baseUrl, timeoutMs = 5000, retries = 2, baseDelayMs = 100, fetchImpl = fetch } = {}) {
  async function request(method, path, { body, headers = {}, retry = IDEMPOTENT.has(method) } = {}) {
    const url = new URL(path, baseUrl);
    const maxAttempts = retry ? retries + 1 : 1;   // POST is NOT retried by default: it could charge a card twice

    for (let attempt = 1; ; attempt++) {
      let response;
      try {
        response = await fetchImpl(url, {
          method,
          headers: { Accept: 'application/json', ...(body && { 'Content-Type': 'application/json' }), ...headers },
          body: body && JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),   // ALWAYS set a timeout; the default is to wait forever
        });
      } catch (error) {
        const failure = error.name === 'TimeoutError' ? new TimeoutError(`${method} ${url} timed out after ${timeoutMs} ms`) : error;
        if (attempt < maxAttempts) {
          await sleep(backoff(attempt));
          continue;
        }
        throw failure;
      }

      if (response.ok) {
        return response.status === 204 ? null : response.json();
      }

      const errorBody = await response.text();
      if (attempt < maxAttempts && RETRYABLE_STATUS.has(response.status)) {
        // Respect the server's Retry-After (seconds) when it tells us how long to wait
        const retryAfter = Number(response.headers.get('retry-after'));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoff(attempt));
        continue;
      }
      throw new HttpError(response.status, errorBody, url.href);   // 4xx: our request is wrong, retrying won't help
    }
  }

  // Exponential backoff with JITTER: 100, 200, 400 ms... +/- randomness so many clients don't retry in lockstep
  function backoff(attempt) {
    const base = baseDelayMs * 2 ** (attempt - 1);
    return base / 2 + Math.random() * base / 2;
  }

  return {
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
  };
}
