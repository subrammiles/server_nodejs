// A CONTRACT TEST: one suite that EVERY course repository must pass (in-memory, SQLite, PostgreSQL).
// This is what makes the repositories safely interchangeable.
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

export function repositoryContract(name, createRepository) {
  describe(`${name} repository contract`, () => {
    let repo;
    beforeEach(async () => { repo = await createRepository(); });

    const base = { page: 0, size: 10, sort: 'title' };

    it('starts with the 3 seed courses', async () => {
      const { items, total } = await repo.list(base);
      assert.equal(total, 3);
      assert.deepEqual(items.map((c) => c.title), ['Data Structures and Algorithms', 'Node.js Fundamentals', 'REST API Design']);
    });

    it('filters, searches, sorts descending and pages', async () => {
      const { items, total } = await repo.list({ ...base, category: 'backend', q: 'e', sort: '-price', size: 1 });
      assert.equal(total, 2);
      assert.equal(items[0].title, 'Node.js Fundamentals');
    });

    it('creates with a generated id and timestamp, finds by id and case-insensitive title', async () => {
      const created = await repo.create({ title: 'Kubernetes', category: 'devops', durationHours: 20, price: 2499 });
      assert.ok(created.id > 3);
      assert.ok(created.createdAt);
      assert.deepEqual(await repo.findById(created.id), created);
      assert.equal((await repo.findByTitle('KUBERNETES')).id, created.id);
      assert.equal(await repo.findById(999), null);
      assert.equal(await repo.findByTitle('nope'), null);
    });

    it('updates only the given fields and deletes', async () => {
      const updated = await repo.update(1, { price: 1 });
      assert.equal(updated.price, 1);
      assert.equal(updated.title, 'Node.js Fundamentals');
      assert.equal(await repo.update(999, { price: 1 }), null);
      assert.equal(await repo.delete(1), true);
      assert.equal(await repo.delete(1), false);
    });
  });
}
