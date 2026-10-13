import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { NotesStore } from './notes-store.js';

describe('NotesStore', () => {
  let store;

  beforeEach(async () => {
    // Every test gets its own empty temp folder: no shared state, no cleanup problems
    store = await new NotesStore(await mkdtemp(join(tmpdir(), 'notes-'))).init();
  });

  it('saves, reads, lists and deletes', async () => {
    await store.save('b-note', 'B');
    await store.save('a-note', 'A');
    assert.deepEqual(await store.list(), ['a-note', 'b-note']);
    assert.equal((await store.get('a-note')).text, 'A');
    await store.delete('a-note');
    assert.deepEqual(await store.list(), ['b-note']);
  });

  it('returns null for a missing note instead of throwing', async () => {
    assert.equal(await store.get('ghost'), null);
  });

  it('appends to an audit log', async () => {
    await store.save('x', '1');
    await store.save('x', '2');
    const log = await readFile(join(store.directory, 'audit.log'), 'utf8');
    assert.equal(log.trim().split('\n').length, 2);
  });

  it('rejects path traversal attempts', async () => {
    await assert.rejects(store.save('../../etc/passwd', 'evil'), /Invalid note id/);
  });

  it('stat() reports the file size', async () => {
    await store.save('sized', 'hello');
    assert.ok((await store.sizeOf('sized')) > 'hello'.length);
  });
});
