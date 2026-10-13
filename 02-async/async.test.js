import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as sleep } from 'node:timers/promises';
import { loadTwoFilesWithCallbacks } from './callbacks.js';
import { fetchAllSettled, fetchParallel, fetchSequential, loadTwoFiles, mapLimit, retry, withTimeout } from './promises.js';

const dir = await mkdtemp(join(tmpdir(), 'async-'));
const a = join(dir, 'a.json');
const b = join(dir, 'b.json');
await writeFile(a, '{"x":1}');
await writeFile(b, '{"y":2}');

describe('callbacks vs promises', () => {
  it('callback style', (t, done) => {
    loadTwoFilesWithCallbacks(a, b, (err, result) => {
      assert.ifError(err);
      assert.deepEqual(result, { x: 1, y: 2 });
      done();
    });
  });

  it('callback style reports errors as the first argument', (t, done) => {
    loadTwoFilesWithCallbacks(a, join(dir, 'missing.json'), (err) => {
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });

  it('async/await style', async () => {
    assert.deepEqual(await loadTwoFiles(a, b), { x: 1, y: 2 });
    await assert.rejects(loadTwoFiles(a, join(dir, 'missing.json')), { code: 'ENOENT' });
  });
});

describe('combinators', () => {
  it('parallel is faster than sequential', async () => {
    let start = performance.now();
    await fetchSequential([1, 2, 3]);
    const sequential = performance.now() - start;
    start = performance.now();
    await fetchParallel([1, 2, 3]);
    const parallel = performance.now() - start;
    assert.ok(parallel < sequential / 2, `parallel ${parallel} vs sequential ${sequential}`);
  });

  it('Promise.all fails fast, allSettled collects everything', async () => {
    await assert.rejects(fetchParallel([1, -2]), /not found/);
    assert.deepEqual(await fetchAllSettled([1, -2]), { users: [{ id: 1, name: 'user-1' }], errors: ['User -2 not found'] });
  });
});

describe('patterns', () => {
  it('withTimeout rejects slow work', async () => {
    await assert.rejects(withTimeout((signal) => sleep(1000, null, { signal }), 30), /Timed out/);
    assert.equal(await withTimeout(() => Promise.resolve('fast'), 100), 'fast');
  });

  it('retry succeeds after transient failures and gives up eventually', async () => {
    let calls = 0;
    const result = await retry(async () => {
      calls++;
      if (calls < 3) throw new Error('flaky');
      return 'ok';
    }, { baseDelayMs: 1 });
    assert.equal(result, 'ok');
    assert.equal(calls, 3);

    await assert.rejects(retry(async () => { throw new Error('down'); }, { attempts: 2, baseDelayMs: 1 }), /down/);
  });

  it('mapLimit never runs more than `limit` tasks at once and keeps order', async () => {
    let running = 0;
    let maxRunning = 0;
    const results = await mapLimit([5, 1, 3, 2], 2, async (n) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await sleep(n);
      running--;
      return n * 10;
    });
    assert.deepEqual(results, [50, 10, 30, 20]);
    assert.equal(maxRunning, 2);
  });
});
