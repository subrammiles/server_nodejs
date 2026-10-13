import express from 'express';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

// state.shuttingDown is flipped by server.js on SIGTERM, so readiness fails and the load balancer stops sending traffic
export function createApp({ logger, readinessChecks = {}, state = { shuttingDown: false } }) {
  const app = express();
  app.disable('x-powered-by');

  // One log line per request, with a REQUEST ID that is also returned to the caller and can be
  // passed on to downstream services: follow one request across all logs.
  app.use(pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.get('x-request-id') ?? randomUUID();
      res.set('x-request-id', id);
      return id;
    },
    customLogLevel: (req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
  }));
  app.use(express.json());

  // LIVENESS: "is the process alive?" Failing it makes the orchestrator RESTART the container.
  // Keep it trivial: never check dependencies here, or a database outage restarts every instance.
  app.get('/health/live', (req, res) => res.json({ status: 'UP' }));

  // READINESS: "can I take traffic right now?" Failing it only REMOVES the instance from the load balancer.
  app.get('/health/ready', async (req, res) => {
    if (state.shuttingDown) return res.status(503).json({ status: 'SHUTTING_DOWN' });
    const results = {};
    for (const [name, check] of Object.entries(readinessChecks)) {
      try {
        await check();
        results[name] = 'UP';
      } catch (error) {
        results[name] = `DOWN: ${error.message}`;
      }
    }
    const ok = Object.values(results).every((r) => r === 'UP');
    res.status(ok ? 200 : 503).json({ status: ok ? 'UP' : 'DOWN', checks: results });
  });

  app.get('/api/hello', (req, res) => {
    req.log.info({ user: req.query.name }, 'greeting requested');   // request-scoped logger carries reqId
    res.json({ message: `Hello, ${req.query.name ?? 'world'}` });
  });

  // A slow endpoint, to watch graceful shutdown finish in-flight work
  app.get('/api/slow', async (req, res) => {
    await sleep(Number(req.query.ms ?? 1000));
    res.json({ done: true });
  });

  app.get('/api/boom', () => {
    throw new Error('unexpected failure');
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    req.log.error({ err }, 'request failed');   // full error in the logs...
    res.status(500).json({ error: 'Internal Server Error', requestId: req.id });   // ...only an id for the client
  });
  return app;
}
