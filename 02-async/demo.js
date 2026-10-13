// Run: node 02-async/demo.js
import { fetchAllSettled, fetchParallel, fetchSequential, mapLimit, retry, withTimeout, fetchUser } from './promises.js';
import { setTimeout as sleep } from 'node:timers/promises';

async function timed(label, fn) {
  const start = performance.now();
  const result = await fn();
  console.log(`${label.padEnd(28)} ${String(Math.round(performance.now() - start)).padStart(4)} ms`, JSON.stringify(result));
}

await timed('sequential (3 x 50 ms)', () => fetchSequential([1, 2, 3]).then((u) => u.length));
await timed('parallel   (3 x 50 ms)', () => fetchParallel([1, 2, 3]).then((u) => u.length));
await timed('allSettled with a failure', () => fetchAllSettled([1, -2, 3]));

try {
  await withTimeout((signal) => sleep(500, 'too slow', { signal }), 100);
} catch (e) {
  console.log('withTimeout                 ', e.message);
}

await timed('retry (fails twice)', () =>
  retry(async (attempt) => {
    if (attempt < 3) throw new Error('flaky');
    return `succeeded on attempt ${attempt}`;
  }));

await timed('mapLimit 6 items, limit 2', () => mapLimit([1, 2, 3, 4, 5, 6], 2, (id) => fetchUser(id)).then((u) => u.length));

try {
  await fetchUser(-1);
} catch (e) {
  console.log('try/catch around await      ', e.message);
}
