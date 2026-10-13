// UNIT test of the service with a FAKE repository: no HTTP, no database, milliseconds.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CourseService } from '../src/courses/course.service.js';
import { InMemoryCourseRepository } from '../src/courses/in-memory.repository.js';
import { ConflictError, NotFoundError } from '../src/errors.js';

describe('CourseService', () => {
  const service = () => new CourseService(new InMemoryCourseRepository([{ title: 'A', category: 'c', durationHours: 1, price: 1 }]));

  it('computes page metadata', async () => {
    const result = await service().list({ page: 0, size: 10, sort: 'title' });
    assert.deepEqual(result.page, { number: 0, size: 10, totalElements: 1, totalPages: 1 });
  });

  it('enforces unique titles, but lets a course keep its own title', async () => {
    const s = service();
    await assert.rejects(s.create({ title: 'a', category: 'c', durationHours: 1, price: 1 }), ConflictError);
    const updated = await s.update(1, { title: 'A', price: 5 });
    assert.equal(updated.price, 5);
  });

  it('throws NotFoundError for missing ids', async () => {
    await assert.rejects(service().get(42), NotFoundError);
    await assert.rejects(service().delete(42), NotFoundError);
  });
});

// The in-memory repository must satisfy the same contract as the database ones (lessons 15 and 16)
import { repositoryContract } from './repository-contract.js';
repositoryContract('in-memory', () => new InMemoryCourseRepository());
