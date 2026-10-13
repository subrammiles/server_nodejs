// Runs against a REAL PostgreSQL started in Docker by Testcontainers. Skipped when Docker is unavailable.
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import knexFactory from 'knex';
import request from 'supertest';
import { createApp } from '../14-rest-api/src/app.js';
import { repositoryContract } from '../14-rest-api/test/repository-contract.js';
import { knexConfig } from './knexfile.js';
import { KnexCourseRepository } from './knex-course.repository.js';
import { CourseFullError, EnrollmentService } from './enrollment.service.js';

function dockerAvailable() {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

const skip = dockerAvailable() ? false : 'Docker is not available';
let container;
let knex;

describe('PostgreSQL with Knex', { skip, timeout: 120_000 }, () => {
  before(async () => {
    const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
    container = await new PostgreSqlContainer('postgres:17-alpine').start();
    knex = knexFactory(knexConfig(container.getConnectionUri()));
    await knex.migrate.latest();
  });

  after(async () => {
    await knex?.destroy();
    await container?.stop();
  });

  beforeEach(() => knex.seed.run());   // known data before every test

  repositoryContract('PostgreSQL (Knex)', () => new KnexCourseRepository(knex));

  it('migrations can be rolled back and re-applied', async () => {
    await knex.migrate.rollback();
    assert.equal(await knex.schema.hasTable('courses'), false);
    await knex.migrate.latest();
    assert.equal(await knex.schema.hasTable('courses'), true);
    await knex.seed.run();
  });

  it('joins: students in a course and counts per course', async () => {
    const enrollments = new EnrollmentService(knex);
    await enrollments.enroll(2, 1);
    assert.deepEqual((await enrollments.studentsIn(1)).map((s) => s.name), ['Ravi', 'Subbu']);
    assert.deepEqual(await enrollments.enrollmentCounts(), [
      { title: 'Node.js Fundamentals', students: 2 },
      { title: 'Data Structures and Algorithms', students: 0 },
      { title: 'REST API Design', students: 0 },
    ]);
  });

  it('constraints: no double enrolment, no unknown student', async () => {
    const enrollments = new EnrollmentService(knex);
    await assert.rejects(enrollments.enroll(1, 1), /duplicate key/);
    await assert.rejects(enrollments.enroll(99, 2), /foreign key/);
  });

  it('row locking prevents overbooking under concurrency', async () => {
    await knex('courses').where({ id: 3 }).update({ capacity: 1 });
    const enrollments = new EnrollmentService(knex);
    const results = await Promise.allSettled([enrollments.enroll(1, 3), enrollments.enroll(2, 3)]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.ok(results.find((r) => r.status === 'rejected').reason instanceof CourseFullError);
    assert.deepEqual(await enrollments.enrollmentCounts().then((c) => c[2].students), 1);
  });

  it('the lesson-14 API runs on PostgreSQL unchanged', async () => {
    const app = createApp({ courseRepository: new KnexCourseRepository(knex) });
    const res = await request(app).get('/api/courses?sort=-price').expect(200);
    assert.equal(res.body.items[0].price, 2999);   // a number, not the string pg returns
    await request(app).post('/api/courses').send({ title: 'node.js fundamentals', category: 'x', durationHours: 1, price: 1 }).expect(409);
  });
});
