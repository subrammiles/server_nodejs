import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker.js';
import { HttpError, TimeoutError, createHttpClient } from './http-client.js';

// A local STUB of the remote API: scripted, offline, and able to fail on demand
const script = new Map();
const hits = new Map();
const stub = createServer(async (req, res) => {
  hits.set(req.url, (hits.get(req.url) ?? 0) + 1);
  const replies = script.get(`${req.method} ${req.url}`) ?? [{ status: 404, body: { error: 'no script' } }];
  const reply = replies.length > 1 ? replies.shift() : replies[0];
  if (reply.delayMs) await new Promise((r) => setTimeout(r, reply.delayMs));
  res.writeHead(reply.status, { 'Content-Type': 'application/json', ...reply.headers });
  res.end(JSON.stringify(reply.body ?? {}));
});

describe('robust HTTP client', () => {
  let client;

  before(async () => {
    stub.listen(0);
    await once(stub, 'listening');
  });
  after(() => stub.close());
  beforeEach(() => {
    script.clear();
    hits.clear();
    client = createHttpClient({ baseUrl: `http://localhost:${stub.address().port}`, timeoutMs: 200, retries: 2, baseDelayMs: 5 });
  });

  it('returns parsed JSON', async () => {
    script.set('GET /users/1', [{ status: 200, body: { id: 1 } }]);
    assert.deepEqual(await client.get('/users/1'), { id: 1 });
  });

  it('retries transient 5xx errors, then succeeds', async () => {
    script.set('GET /flaky', [{ status: 503 }, { status: 503 }, { status: 200, body: { ok: true } }]);
    assert.deepEqual(await client.get('/flaky'), { ok: true });
    assert.equal(hits.get('/flaky'), 3);
  });

  it('gives up after the retry budget', async () => {
    script.set('GET /down', [{ status: 500 }]);
    await assert.rejects(client.get('/down'), (e) => e instanceof HttpError && e.status === 500);
    assert.equal(hits.get('/down'), 3);
  });

  it('does not retry 4xx', async () => {
    await assert.rejects(client.get('/missing'), (e) => e instanceof HttpError && e.status === 404);
    assert.equal(hits.get('/missing'), 1);
  });

  it('does not retry POST (not idempotent) unless asked to', async () => {
    script.set('POST /payments', [{ status: 503 }, { status: 201, body: { id: 9 } }]);
    await assert.rejects(client.post('/payments', { amount: 10 }), HttpError);
    assert.equal(hits.get('/payments'), 1);
    assert.deepEqual(await client.post('/payments', { amount: 10 }, { retry: true }), { id: 9 });
  });

  it('honours Retry-After on 429', async () => {
    script.set('GET /limited', [{ status: 429, headers: { 'Retry-After': '1' } }, { status: 200, body: {} }]);
    const start = performance.now();
    await client.get('/limited');
    assert.ok(performance.now() - start >= 950);
  });

  it('times out slow responses', async () => {
    script.set('GET /slow', [{ status: 200, delayMs: 1000 }]);
    const noRetry = createHttpClient({ baseUrl: `http://localhost:${stub.address().port}`, timeoutMs: 50, retries: 0 });
    await assert.rejects(noRetry.get('/slow'), TimeoutError);
  });
});

describe('circuit breaker', () => {
  it('opens after repeated failures, fails fast, then recovers after the cooldown', async () => {
    let now = 0;
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000, now: () => now });
    const failing = async () => { throw new Error('down'); };
    let calls = 0;
    const counted = async () => { calls++; return failing(); };

    await assert.rejects(breaker.call(counted), /down/);
    await assert.rejects(breaker.call(counted), /down/);
    assert.equal(breaker.state, 'OPEN');

    await assert.rejects(breaker.call(counted), CircuitOpenError);
    assert.equal(calls, 2);   // the third call never reached the dependency

    now = 1000;   // cooldown over: one trial call is allowed
    assert.equal(await breaker.call(async () => 'recovered'), 'recovered');
    assert.equal(breaker.state, 'CLOSED');
  });

  it('a failed trial call re-opens the circuit', async () => {
    let now = 0;
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 100, now: () => now });
    await assert.rejects(breaker.call(async () => { throw new Error('x'); }));
    now = 100;
    await assert.rejects(breaker.call(async () => { throw new Error('still down'); }), /still down/);
    assert.equal(breaker.state, 'OPEN');
  });
});
