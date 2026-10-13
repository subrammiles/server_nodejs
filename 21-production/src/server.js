// Entry point: config -> logger -> app -> listen -> graceful shutdown.
// Run: node 21-production/src/server.js   (then Ctrl+C, or: kill -TERM <pid>)
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';
import { createApp } from './app.js';

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const logger = createLogger({ level: config.LOG_LEVEL });
const state = { shuttingDown: false };
const app = createApp({
  logger,
  state,
  readinessChecks: {
    // e.g. database: () => knex.raw('select 1')
    memory: async () => {
      if (process.memoryUsage().heapUsed > 1.5e9) throw new Error('heap above 1.5 GB');
    },
  },
});

const server = app.listen(config.PORT, () => {
  logger.info({ port: server.address().port, env: config.NODE_ENV }, 'server started');
});
server.keepAliveTimeout = 65_000;   // longer than typical load balancer idle timeouts (60 s) to avoid 502s

// GRACEFUL SHUTDOWN: Kubernetes/Docker send SIGTERM, wait, then SIGKILL.
// 1. fail readiness  2. stop accepting connections  3. let in-flight requests finish
// 4. close resources (DB pools...)  5. exit. Force-exit if it takes too long.
function shutdown(signal) {
  if (state.shuttingDown) return;
  state.shuttingDown = true;
  logger.info({ signal }, 'shutting down');

  const force = setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, config.SHUTDOWN_TIMEOUT_MS);
  force.unref();

  server.close((err) => {
    // await knex.destroy(); await redis.quit(); ...
    logger.info('all connections closed, bye');
    logger.flush?.();
    process.exitCode = err ? 1 : 0;
  });
  server.closeIdleConnections();   // idle keep-alive sockets would otherwise keep close() waiting
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// A crash you didn't expect = unknown state: log it and exit; the orchestrator restarts a clean process.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled promise rejection');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  process.exit(1);
});
