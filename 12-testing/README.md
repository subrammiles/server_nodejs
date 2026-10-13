# 12: Testing

Every lesson in this repo has tests. This lesson teaches the techniques themselves.

## The built-in runner (`node:test`): no dependencies
- `describe` / `it` (or `test`), hooks `before`, `beforeEach`, `afterEach`, `after`.
- `node:assert/strict`: `equal`, `deepEqual`, `throws`, `rejects`, `match`, `partialDeepStrictEqual`.
- **Table-driven tests**: loop over cases (`cart.test.js`).
- `it.todo`, `it.skip`, `it.only` (with `--test-only`).
- **Mocks** (`mocking.test.js`): `mock.fn()`, `mock.method(obj, 'name')` with `mock.restoreAll()`, and `mock.timers` for fake time.
- `node --test` finds `*.test.js` files. Add `--watch` to re-run on save, or `--experimental-test-coverage` for coverage.

## Test doubles vocabulary
| Double | Purpose |
|---|---|
| **stub** | returns canned answers (`fetchJson` returning `{ tempC: 31 }`) |
| **spy** | records calls so you can assert on them |
| **mock** | a stub plus expectations about how it's called |
| **fake** | a working lightweight implementation (in-memory DB, fake clock) |

**Design for testability**: inject dependencies (`WeatherService` receives `fetchJson` and `now`).
Then tests need no network and no waiting, and no hacks.

## The testing pyramid
Many fast **unit** tests (pure logic) → fewer **integration** tests (HTTP + DB, e.g. supertest in lesson 14,
Testcontainers in lesson 16) → few **end-to-end** tests. Test behaviour, not implementation details.

## Other frameworks (`other-frameworks/`, from the old repo)
| | node:test | Jest | Mocha + Chai + Sinon |
|---|---|---|---|
| install | built in | one package | three packages |
| mocks | `mock.fn` | `jest.fn` | `sinon.stub/spy` |
| strengths | zero deps, fast | batteries included, snapshots | flexible, mature |

Vitest is a popular, Jest-compatible modern choice too.

## Run
```bash
node --test "12-testing/*.test.js"
npm run test:jest
npm run test:mocha
npm run test:coverage            # whole repo, with a coverage table
```
