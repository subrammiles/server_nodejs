# 21: Production readiness

Code that works on your laptop isn't production-ready until you can **configure, observe, deploy and stop** it safely.

## Concepts
- **Validated configuration** (`config.js`): every env var checked with Zod at startup, with defaults and types,
  and **all** problems reported at once. Invalid config means exit code 1 before serving traffic.
- **Structured logs** with **pino** (`logger.js`): JSON lines with level, time, service, request id and timings.
  **Redact** secrets (authorization headers, passwords). Pipe through `pino-pretty` locally if you like.
- **Request ids** (`x-request-id`): reuse the caller's id or create one, return it, and include it in every log line.
- **Error handling**: log the full error server-side, return only a generic message plus a request id.
- **Health checks**: **liveness** (process alive, restart if not) vs **readiness** (can take traffic, remove from the
  load balancer if not). Never check the database in liveness.
- **Graceful shutdown** (`server.js`): on SIGTERM, fail readiness, stop accepting, finish in-flight requests,
  close pools, exit 0. Force-exit after a timeout. The test proves a slow request survives a SIGTERM.
- **Crash policy**: `unhandledRejection` / `uncaughtException` mean log fatally and exit. Let the orchestrator restart cleanly.
- **Docker**: small base image, `npm ci --omit=dev`, layer caching, non-root `node` user, `CMD ["node", ...]`
  (with `npm start`, SIGTERM would not reach Node). Scale with replicas (one process per container) rather than cluster.
- More to explore: metrics (`prom-client` + Prometheus/Grafana), tracing (OpenTelemetry), process managers (PM2) on VMs,
  CI pipelines (`npm ci && npm test`), `npm audit` and Dependabot.

## Run
```bash
node 21-production/src/server.js                 # JSON logs; Ctrl+C for graceful shutdown
PORT=abc node 21-production/src/server.js        # fails fast with a clear message
curl -H 'x-request-id: demo-1' 'localhost:3000/api/hello?name=Subbu'
curl -i localhost:3000/health/ready
docker build -f 21-production/Dockerfile -t node-production . && docker run -p 3000:3000 node-production
node --test "21-production/test/*.test.js"
```
