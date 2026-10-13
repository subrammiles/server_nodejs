# Node.js backend development: from scratch to advanced

A hands-on course in 22 lessons. Every lesson folder has:
- a **README.md** explaining the concepts, with commands to run,
- small runnable examples (`node <lesson>/<file>.js`),
- **tests** that prove the examples work (`node --test`).

Companion repositories: `server_spring` (Spring Framework) and `server_spring_boot` (Spring Boot) teach the same
backend ideas on the JVM. Compare lesson 14 here with module 03 there.

## Requirements
- **Node.js 22.18+** (developed on Node 24). No build step: plain ES modules, plus TypeScript run natively in lesson 22.
- Docker (optional): PostgreSQL for lesson 16 (its tests are skipped without Docker) and the image in lesson 21.

```bash
npm install
npm test                     # every lesson's tests (built-in node:test runner)
node --test "08-http-server/*.test.js"    # one lesson
npm run test:coverage        # with a coverage report
npm run typecheck            # TypeScript lesson
```

## Roadmap

### Part 1: Node.js core (no frameworks, no dependencies)
| # | Lesson | You will learn |
|---|---|---|
| 01 | [Modules](01-modules) | ESM vs CommonJS, `node:` imports, `import.meta`, dynamic import, JSON modules |
| 02 | [Async programming](02-async) | callbacks, promises, async/await, `Promise.all/allSettled`, timeouts, retries, concurrency limits |
| 03 | [Event loop](03-event-loop) | phases, `nextTick` vs microtasks, why blocking code freezes every user |
| 04 | [Events](04-events) | `EventEmitter`, the `'error'` event, `events.once/on`, a hand-written emitter |
| 05 | [Files and paths](05-files) | `fs/promises`, `path`, error codes, path traversal |
| 06 | [Buffers and streams](06-streams) | Buffers, encodings, Transform streams, `pipeline`, backpressure, gzip, readline |
| 07 | [Process and CLIs](07-process-and-cli) | env vars, `--env-file`, `util.parseArgs`, stdin/stdout, exit codes, signals |
| 08 | [HTTP server](08-http-server) | `node:http` with no framework: routing, bodies, status codes, static files |
| 09 | [Networking](09-networking) | TCP chat (framing), UDP, DNS, built-in `fetch` |
| 10 | [Crypto](10-crypto) | hashing, HMAC, password hashing (scrypt), AES-GCM, secure random |
| 11 | [Concurrency](11-concurrency) | worker threads and a worker pool, child processes, cluster |
| 12 | [Testing](12-testing) | `node:test`, mocks/stubs/fake timers, testing pyramid, and Jest / Mocha + Chai + Sinon |

### Part 2: Building APIs
| # | Lesson | You will learn |
|---|---|---|
| 13 | [Express basics](13-express-basics) | Express 5 middleware, routing, routers, async errors, supertest |
| 14 | [REST API](14-rest-api) | layered architecture, Zod validation, RFC 9457 errors, paging, OpenAPI/Swagger |
| 15 | [SQL with SQLite](15-sql-sqlite) | schema, migrations, prepared statements, **SQL injection**, transactions, repository contract tests |
| 16 | [PostgreSQL + Knex](16-postgres-knex) | pools, migrations/seeds, joins, transactions, **row locking**, Testcontainers |
| 17 | [Auth and security](17-auth-security) | password storage, JWT, roles/ownership, helmet, CORS, rate limiting |

### Part 3: Integrations and production
| # | Lesson | You will learn |
|---|---|---|
| 18 | [HTTP clients](18-http-clients) | timeouts, retries with backoff, idempotency, `Retry-After`, circuit breaker |
| 19 | [WebSockets](19-websockets) | realtime chat, rooms, presence, heartbeats |
| 20 | [AWS](20-aws) | SDK v3: S3, DynamoDB, SQS, Lambda, credentials, mocking AWS in tests |
| 21 | [Production readiness](21-production) | validated config, pino logs, request ids, health checks, graceful shutdown, Docker |
| 22 | [TypeScript](22-typescript) | types, generics, unions, type guards, typed Express, running `.ts` natively |

## Where the old examples went
The previous folders were cleaned up, fixed and merged into the lessons above:

| Old | Now |
|---|---|
| `a_basics`, `b_simple_server` | 01, 08 |
| `c_nodejs_core` (events, streams, buffers, process, net/http/udp, tls, crypto, cpu-bound, websocket) | 03, 04, 06, 07, 08, 09, 10, 11, 19 |
| `d_express_js` (routing, routers, middleware, static, cookies/cors/basic auth, mysql) | 13, 15, 17 |
| `e_nodejs_other` (axios, swagger, dotenv, AWS SDK v2, oracle) | 14, 18, 20, 07, 16 |
| `f_nodejs_test` (assert, jest, mocha, chai, sinon, tap, nock) | 12 (plus tests in every lesson) |
| `miss/knex`, `miss/utils*`, `miss/aws_serverless` | 16, 02 (concurrency instead of `async`), 20 |

Bugs fixed on the way include a stream that wrote to the wrong path, an async file callback that logged the wrong
variable, MySQL connections reused after `end()`, and a database password committed in a knexfile.
Placeholder files that did nothing were dropped.

## Where to go next
NestJS (structured framework with DI), Fastify (fast Express alternative), Prisma/Drizzle (ORMs), BullMQ (job queues
with Redis), GraphQL, Kafka (`server_kafka` repo), OpenTelemetry, and Kubernetes.
