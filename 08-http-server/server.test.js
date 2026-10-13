import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createBookServer } from './server.js';

describe('raw node:http server', () => {
  let server;
  let base;

  before(async () => {
    server = createBookServer().listen(0);   // port 0 = any free port
    await once(server, 'listening');
    base = `http://localhost:${server.address().port}`;
  });

  after(() => server.close());

  const post = (body, headers = { 'Content-Type': 'application/json' }) =>
    fetch(`${base}/api/books`, { method: 'POST', headers, body });

  it('lists and searches with a query string', async () => {
    const res = await fetch(`${base}/api/books?q=node`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/json');
    assert.equal((await res.json()).length, 1);
  });

  it('creates with 201 + Location, then reads and deletes', async () => {
    const created = await post(JSON.stringify({ title: '  Streams  ' }));
    assert.equal(created.status, 201);
    const location = created.headers.get('location');
    assert.equal((await created.json()).title, 'Streams');

    assert.equal((await (await fetch(base + location)).json()).title, 'Streams');
    assert.equal((await fetch(base + location, { method: 'DELETE' })).status, 204);
    assert.equal((await fetch(base + location)).status, 404);
  });

  it('validates input and content type', async () => {
    assert.equal((await post('{bad json')).status, 400);
    assert.equal((await post(JSON.stringify({ title: '' }))).status, 400);
    assert.equal((await post('{}', { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await post(JSON.stringify({ title: 'x'.repeat(20_000) }))).status, 413);
  });

  it('405 for unsupported methods', async () => {
    assert.equal((await fetch(`${base}/api/books/1`, { method: 'PUT' })).status, 405);
  });

  it('serves static files with the right content type', async () => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /Served by node:http/);
    assert.equal((await fetch(`${base}/missing.css`)).status, 404);
  });
});
