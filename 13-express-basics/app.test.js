import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './app.js';

// supertest calls the app in-process: no port, no running server needed
describe('Express basics', () => {
  let app;
  before(() => {
    process.env.NODE_ENV = 'test';
    app = createApp();
  });

  it('middleware attaches data to req', async () => {
    const res = await request(app).get('/').expect(200);
    assert.match(res.text, /requested at \d{4}-/);
  });

  it('query strings and route params', async () => {
    assert.deepEqual((await request(app).get('/search?q=node&limit=5')).body, { q: 'node', limit: 5 });
    assert.equal((await request(app).get('/greet/te/Subbu')).text, 'Namaskaram, Subbu!');
    await request(app).get('/greet/xx/Subbu').expect(400);
  });

  it('Express 5 wildcard and optional segments', async () => {
    assert.deepEqual((await request(app).get('/files/a/b/c.txt')).body, { path: 'a/b/c.txt' });
    assert.deepEqual((await request(app).get('/archive')).body, { year: 'all' });
    assert.deepEqual((await request(app).get('/archive/2024')).body, { year: '2024' });
  });

  it('routers with router-level middleware', async () => {
    const res = await request(app).get('/users/1').expect(200).expect('X-Router', 'users');
    assert.equal(res.body.name, 'Subbu');
    await request(app).get('/users/99').expect(404);

    const created = await request(app).post('/users').send({ name: 'Meera' }).expect(201);
    assert.equal(created.headers.location, `/users/${created.body.id}`);
  });

  it('route-specific middleware protects /payments', async () => {
    await request(app).get('/payments/balance').expect(401);
    const res = await request(app).get('/payments/balance').set('x-api-key', 'secret-key').expect(200);
    assert.equal(res.body.balance, 100);
  });

  it('static files and redirects', async () => {
    assert.match((await request(app).get('/static/hello.txt').expect(200)).text, /express.static/);
    await request(app).get('/old-docs').expect(301).expect('Location', '/static/hello.txt');
  });

  it('async errors reach the error handler (Express 5)', async () => {
    await request(app).get('/async-ok').expect(200, { ok: true });
    const res = await request(app).get('/async-fail').expect(500);
    assert.deepEqual(res.body, { error: 'Internal Server Error' });   // no internal details leaked
  });

  it('malformed JSON is a 400 and unknown routes a 404', async () => {
    await request(app).post('/users').set('Content-Type', 'application/json').send('{oops').expect(400);
    await request(app).get('/nope').expect(404, { error: 'Cannot GET /nope' });
  });
});
