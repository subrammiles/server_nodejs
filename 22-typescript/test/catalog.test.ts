import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { CourseCatalog, InMemoryStore, isLevel } from '../src/course-catalog.ts';
import { createApp } from '../src/server.ts';

describe('CourseCatalog (TypeScript)', () => {
  it('returns Result objects instead of throwing', () => {
    const catalog = new CourseCatalog();
    const added = catalog.add({ title: 'TS', level: 'beginner', price: 10 });
    assert.ok(added.ok);
    assert.equal(added.value.id, 1);

    const failed = catalog.add({ title: 'Bad', level: 'advanced', price: -1 });
    assert.ok(!failed.ok);
    assert.equal(failed.error, 'price must not be negative');

    const missing = catalog.update(99, { price: 1 });
    assert.deepEqual(missing, { ok: false, error: 'course 99 not found' });
  });

  it('averagePrice is null for an empty catalog', () => {
    const catalog = new CourseCatalog();
    assert.equal(catalog.averagePrice(), null);
    catalog.add({ title: 'A', level: 'beginner', price: 10 });
    catalog.add({ title: 'B', level: 'advanced', price: 30 });
    assert.equal(catalog.averagePrice(), 20);
  });

  it('generic store and type guard', () => {
    const store = new InMemoryStore<{ id: number; name: string }>();
    store.save({ id: 1, name: 'x' });
    assert.equal(store.find(1)?.name, 'x');
    assert.equal(store.find(2), undefined);
    assert.equal(isLevel('advanced'), true);
    assert.equal(isLevel('expert'), false);
  });

  it('typed Express app validates at runtime too', async () => {
    const app = createApp();
    await request(app).post('/courses').send({ title: 'TS', level: 'beginner', price: 5 }).expect(201);
    await request(app).post('/courses').send({ title: 'TS', level: 'expert', price: 5 }).expect(400);
    const list = await request(app).get('/courses?level=beginner').expect(200);
    assert.equal(list.body.length, 1);
    await request(app).get('/courses?level=nope').expect(400);
  });
});
