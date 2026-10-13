import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Writable } from 'node:stream';
import request from 'supertest';
import { loadConfig } from '../src/config.js';
import { createLogger } from '../src/logger.js';
import { createApp } from '../src/app.js';

// Captures log lines in memory so tests can assert on them
function memoryLogger() {
  const lines = [];
  const destination = new Writable({ write(chunk, enc, cb) { lines.push(JSON.parse(chunk)); cb(); } });
  return { logger: createLogger({ level: 'info', destination }), lines };
}

describe('configuration', () => {
  it('applies defaults and coerces types', () => {
    const config = loadConfig({ PORT: '8080' });
    assert.equal(config.PORT, 8080);
    assert.equal(config.NODE_ENV, 'development');
    assert.ok(Object.isFrozen(config));
  });

  it('reports every invalid variable at once', () => {
    assert.throws(() => loadConfig({ PORT: 'abc', LOG_LEVEL: 'loud', DATABASE_URL: 'not a url' }),
      (e) => ['PORT', 'LOG_LEVEL', 'DATABASE_URL'].every((v) => e.message.includes(v)));
  });
});

describe('observability', () => {
  it('propagates request ids and logs structured JSON', async () => {
    const { logger, lines } = memoryLogger();
    const app = createApp({ logger });

    const res = await request(app).get('/api/hello?name=Subbu').set('x-request-id', 'abc-123').expect(200);
    assert.equal(res.headers['x-request-id'], 'abc-123');

    const appLine = lines.find((l) => l.msg === 'greeting requested');
    assert.equal(appLine.req.id, 'abc-123');   // pino-http adds the request (with its id) to every line
    assert.equal(appLine.user, 'Subbu');
    const accessLine = lines.find((l) => l.msg === 'request completed');
    assert.equal(accessLine.res.statusCode, 200);
    assert.equal(typeof accessLine.responseTime, 'number');
  });

  it('redacts secrets from logs', async () => {
    const { logger, lines } = memoryLogger();
    await request(createApp({ logger })).get('/api/hello').set('Authorization', 'Bearer super-secret');
    const logged = JSON.stringify(lines);
    assert.doesNotMatch(logged, /super-secret/);
    assert.match(logged, /\[Redacted\]/);
  });

  it('500s log the full error but return only a request id', async () => {
    const { logger, lines } = memoryLogger();
    const res = await request(createApp({ logger })).get('/api/boom').expect(500);
    assert.ok(res.body.requestId);
    assert.doesNotMatch(JSON.stringify(res.body), /unexpected failure/);
    assert.ok(lines.some((l) => l.level === 50 && l.err?.message === 'unexpected failure'));
  });
});

describe('health checks', () => {
  it('liveness is trivial; readiness reflects dependencies and shutdown', async () => {
    const { logger } = memoryLogger();
    let dbUp = true;
    const state = { shuttingDown: false };
    const app = createApp({ logger, state, readinessChecks: { database: async () => { if (!dbUp) throw new Error('timeout'); } } });

    await request(app).get('/health/live').expect(200);
    await request(app).get('/health/ready').expect(200, { status: 'UP', checks: { database: 'UP' } });

    dbUp = false;
    const down = await request(app).get('/health/ready').expect(503);
    assert.equal(down.body.checks.database, 'DOWN: timeout');
    await request(app).get('/health/live').expect(200);   // a DB outage must NOT restart the process

    dbUp = true;
    state.shuttingDown = true;
    await request(app).get('/health/ready').expect(503, { status: 'SHUTTING_DOWN' });
  });
});

describe('graceful shutdown', () => {
  it('finishes in-flight requests after SIGTERM, then exits with code 0', { timeout: 15000 }, async () => {
    const child = spawn(process.execPath, [new URL('../src/server.js', import.meta.url).pathname], {
      env: { ...process.env, PORT: '0', LOG_LEVEL: 'info' },
    });
    let logs = '';
    child.stdout.on('data', (d) => { logs += d; });
    while (!logs.includes('server started')) await new Promise((r) => setTimeout(r, 20));
    const port = JSON.parse(logs.split('\n').find((l) => l.includes('server started'))).port;

    const inFlight = fetch(`http://localhost:${port}/api/slow?ms=700`);
    await new Promise((r) => setTimeout(r, 150));
    child.kill('SIGTERM');

    const res = await inFlight;
    assert.equal(res.status, 200);   // the slow request was allowed to finish
    const [code] = await once(child, 'exit');
    assert.equal(code, 0);
    assert.match(logs, /shutting down/);
    assert.match(logs, /all connections closed/);
  });

  it('refuses to start with invalid configuration', async () => {
    const child = spawn(process.execPath, [new URL('../src/server.js', import.meta.url).pathname], {
      env: { ...process.env, PORT: 'not-a-port' },
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d; });
    const [code] = await once(child, 'exit');
    assert.equal(code, 1);
    assert.match(stderr, /Invalid configuration/);
  });
});
