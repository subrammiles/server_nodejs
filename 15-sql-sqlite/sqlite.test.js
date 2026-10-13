import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../14-rest-api/src/app.js';
import { repositoryContract } from '../14-rest-api/test/repository-contract.js';
import { openDatabase } from './database.js';
import { SqliteCourseRepository } from './sqlite-course.repository.js';
import { findSafe, findUnsafe } from './sql-injection.js';

repositoryContract('SQLite', () => new SqliteCourseRepository(openDatabase()));

describe('SQLite specifics', () => {
  it('migrations run once and data persists in a file', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'sqlite-')), 'test.db');
    const first = openDatabase(file);
    await new SqliteCourseRepository(first).create({ title: 'Persisted', category: 'x', durationHours: 1, price: 0 });
    first.close();

    const reopened = openDatabase(file);
    assert.equal(reopened.prepare('PRAGMA user_version').get().user_version, 2);
    assert.ok(await new SqliteCourseRepository(reopened).findByTitle('persisted'));
    assert.equal(reopened.prepare('SELECT COUNT(*) AS n FROM courses').get().n, 4);   // seeded only once
    reopened.close();
  });

  it('constraints are enforced by the database itself', () => {
    const db = openDatabase();
    assert.throws(() => db.prepare("INSERT INTO courses (title, category, duration_hours, price) VALUES ('x', 'c', 0, 1)").run(), /CHECK constraint/);
    assert.throws(() => db.prepare("INSERT INTO courses (title, category, duration_hours, price) VALUES ('rest api design', 'c', 1, 1)").run(), /UNIQUE/);
  });

  it('transactions are all or nothing', async () => {
    const db = openDatabase();
    const repo = new SqliteCourseRepository(db);
    await assert.rejects(repo.importAll([
      { title: 'One', category: 'c', durationHours: 1, price: 1 },
      { title: 'One', category: 'c', durationHours: 1, price: 1 },   // duplicate: fails
    ]), /UNIQUE/);
    assert.equal(await repo.findByTitle('One'), null);   // the first insert was rolled back too
    assert.equal(await repo.importAll([{ title: 'Two', category: 'c', durationHours: 1, price: 1 }]), 1);
  });

  it('SQL injection: string concatenation leaks data, parameters do not', () => {
    const db = openDatabase();
    const attack = "x' OR '1'='1";
    assert.equal(findUnsafe(db, attack).length, 3);
    assert.deepEqual(findSafe(db, attack), []);
  });

  it('plugs into the lesson-14 API unchanged', async () => {
    const app = createApp({ courseRepository: new SqliteCourseRepository(openDatabase()) });
    const created = await request(app).post('/api/courses')
      .send({ title: 'SQL', category: 'data', durationHours: 4, price: 10 }).expect(201);
    await request(app).get(created.headers.location).expect(200);
    await request(app).post('/api/courses').send({ title: 'sql', category: 'data', durationHours: 4, price: 10 }).expect(409);
  });
});
