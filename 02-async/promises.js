// Promises and async/await: the modern way. Plus the patterns every backend needs.
import { promisify } from 'node:util';
import { setTimeout as sleep } from 'node:timers/promises';
import { readJson } from './callbacks.js';

// Turn a callback-style function into a promise-returning one
export const readJsonAsync = promisify(readJson);

// Same as loadTwoFilesWithCallbacks, but flat and with one try/catch for all errors
export async function loadTwoFiles(pathA, pathB) {
  const a = await readJsonAsync(pathA);
  const b = await readJsonAsync(pathB);
  return { ...a, ...b };
}

// Simulated remote call, e.g. a database or HTTP request
export async function fetchUser(id, delayMs = 50) {
  await sleep(delayMs);
  if (id < 0) throw new Error(`User ${id} not found`);
  return { id, name: `user-${id}` };
}

// SEQUENTIAL: total time = sum of all calls. Use only when each call needs the previous result.
export async function fetchSequential(ids) {
  const users = [];
  for (const id of ids) {
    users.push(await fetchUser(id));
  }
  return users;
}

// PARALLEL: total time = the slowest call. Promise.all fails fast on the first rejection.
export function fetchParallel(ids) {
  return Promise.all(ids.map((id) => fetchUser(id)));
}

// Promise.allSettled: wait for everything, collect successes AND failures
export async function fetchAllSettled(ids) {
  const results = await Promise.allSettled(ids.map((id) => fetchUser(id)));
  return {
    users: results.filter((r) => r.status === 'fulfilled').map((r) => r.value),
    errors: results.filter((r) => r.status === 'rejected').map((r) => r.reason.message),
  };
}

// TIMEOUT: give up if an operation is too slow. AbortSignal.timeout() is built in.
export async function withTimeout(promiseFactory, ms) {
  const signal = AbortSignal.timeout(ms);
  return Promise.race([
    promiseFactory(signal),
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error(`Timed out after ${ms} ms`)))),
  ]);
}

// RETRY with exponential backoff: for transient failures (network blips, restarts)
export async function retry(fn, { attempts = 3, baseDelayMs = 20 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

// CONCURRENCY LIMIT: process many items, but at most `limit` at a time
// (e.g. 10 000 files, but only 5 open connections). The old repo used the "async" library for this.
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
