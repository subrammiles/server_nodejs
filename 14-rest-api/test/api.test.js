// INTEGRATION tests: the whole HTTP stack (routing, validation, service, repository, errors) via supertest.
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Course API', () => {
  let app;
  beforeEach(() => { app = createApp(); });   // fresh in-memory data per test

  const valid = { title: 'Docker', category: 'devops', durationHours: 6, price: 799 };

  it('lists with paging, filtering and sorting', async () => {
    const res = await request(app).get('/api/courses?category=backend&sort=-price&size=1').expect(200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].title, 'Node.js Fundamentals');
    assert.deepEqual(res.body.page, { number: 0, size: 1, totalElements: 2, totalPages: 2 });
  });

  it('full CRUD lifecycle with correct status codes', async () => {
    const created = await request(app).post('/api/courses').send(valid).expect(201);
    const location = created.headers.location;
    assert.equal(location, `/api/courses/${created.body.id}`);

    await request(app).get(location).expect(200);
    const patched = await request(app).patch(location).send({ price: 699 }).expect(200);
    assert.equal(patched.body.price, 699);
    assert.equal(patched.body.title, 'Docker');

    await request(app).put(location).send({ ...valid, title: 'Docker Deep Dive' }).expect(200);
    await request(app).delete(location).expect(204);
    await request(app).get(location).expect(404);
  });

  it('validation errors list every invalid field as problem+json', async () => {
    const res = await request(app).post('/api/courses')
      .send({ title: '', category: 'x', durationHours: -1, price: 'free', id: 7 })
      .expect(400)
      .expect('Content-Type', /application\/problem\+json/);
    const fields = res.body.errors.map((e) => e.field).sort();
    assert.deepEqual(fields, ['(root)', 'durationHours', 'price', 'title']);   // (root) = unknown key "id"
  });

  it('validates query and path parameters too', async () => {
    await request(app).get('/api/courses?size=1000').expect(400);
    await request(app).get('/api/courses/abc').expect(400);
    await request(app).patch('/api/courses/1').send({}).expect(400);
  });

  it('business rule: titles are unique (409)', async () => {
    await request(app).post('/api/courses').send({ ...valid, title: 'rest api design' }).expect(409);
  });

  it('404 and malformed JSON are problems too', async () => {
    const missing = await request(app).get('/api/courses/999').expect(404);
    assert.equal(missing.body.detail, 'Course 999 not found');
    await request(app).get('/api/nothing').expect(404);
    await request(app).post('/api/courses').set('Content-Type', 'application/json').send('{oops').expect(400);
  });

  it('serves the OpenAPI document and Swagger UI', async () => {
    const doc = await request(app).get('/openapi.json').expect(200);
    assert.ok(doc.body.paths['/api/courses']);
    await request(app).get('/docs/').expect(200).expect('Content-Type', /html/);
  });
});
