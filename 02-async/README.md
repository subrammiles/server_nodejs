# 02: Asynchronous programming

Node runs your JavaScript on **one thread**. Slow work (files, network, databases) runs in the background, and
your code continues when the result is ready. That is why almost every Node API is asynchronous.

## Three generations of async code
1. **Callbacks** (`callbacks.js`): `fn(args, (err, result) => ...)`, the *error-first* convention.
   Nesting them gives "callback hell".
2. **Promises**: an object representing a future value. `.then()` / `.catch()`.
   `util.promisify` converts callback APIs, and most core modules have promise versions (`node:fs/promises`).
3. **async/await** (`promises.js`): promises that read like synchronous code. Use `try/catch` for errors.

## Patterns every backend needs (all in `promises.js`, all tested)
| Need | Tool |
|---|---|
| independent calls in parallel | `Promise.all` (fails fast) |
| collect successes **and** failures | `Promise.allSettled` |
| first to finish / first success | `Promise.race` / `Promise.any` |
| give up when too slow | `AbortSignal.timeout(ms)` (`withTimeout`) |
| transient failures | retry with exponential backoff (`retry`) |
| thousands of items, limited resources | concurrency limit (`mapLimit`) |
| delays | `import { setTimeout } from 'node:timers/promises'` |

## Common mistakes
- `await` inside a loop when the calls are independent: slow. Use `Promise.all`.
- Forgetting `await`: the error escapes as an **unhandled rejection**, which crashes Node.
- Mixing callbacks and promises in one function.

## Run
```bash
node 02-async/demo.js
node --test "02-async/*.test.js"
```
