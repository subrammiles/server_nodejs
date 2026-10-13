# 18: Calling other services (robust HTTP clients)

Backends call payment providers, other microservices and public APIs. Over a network, everything fails eventually.

## Concepts
- **Built-in `fetch`**: no library needed. `axios` (used in the old repo) is still common. Its equivalent of this lesson is
  `axios.create({ baseURL, timeout })` plus interceptors, or the `axios-retry` package.
- **Timeouts on every call**: `AbortSignal.timeout(ms)`. Without one, a hung dependency hangs your requests too.
- **Retries only for transient failures**: network errors, 408/429/5xx. **Never 4xx** (the request is wrong).
- **Only retry idempotent requests** (GET/PUT/DELETE). Retrying a POST can create two orders or two payments,
  unless the API supports **idempotency keys**.
- **Exponential backoff with jitter**, and respect **`Retry-After`**.
- **Concurrency limits** for batches (`mapLimit` from lesson 02).
- **Circuit breaker** (`circuit-breaker.js`): stop hammering a failing dependency, fail fast, probe for recovery.
  The `opossum` package is a production-grade version.
- **Typed errors** (`HttpError`, `TimeoutError`) so callers can decide: retry, fall back, or return 502.
- **Testing**: a local stub server that can be scripted to fail (503, 503, 200) and to be slow. Fast, offline and deterministic.
  Alternatives: `nock`, `msw`, undici's `MockAgent`.

## Run
```bash
node 18-http-clients/demo.js          # needs internet
node --test "18-http-clients/*.test.js"
```
