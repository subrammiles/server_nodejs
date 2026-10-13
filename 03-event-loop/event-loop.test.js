import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { recordOrder } from './order.js';

test('execution order: sync, nextTick, microtasks, check phase, then timers', async () => {
  assert.deepEqual(await recordOrder(), [
    '1 sync code',
    '2 sync code',
    'nextTick queue',
    'microtask: promise.then',
    'microtask: queueMicrotask',
    // From an I/O callback the loop reaches "check" before looping back to "timers"
    'check: setImmediate',
    'timers: setTimeout 0',
  ]);
});

async function timeRequest(base, path) {
  const start = performance.now();
  await (await fetch(base + path)).text();
  return performance.now() - start;
}

test('CPU work blocks other requests; async waiting does not', { timeout: 15000 }, async () => {
  // The server MUST run in another process: busy-waiting in this process would freeze the test itself.
  const child = spawn(process.execPath, [new URL('./blocking-server.js', import.meta.url).pathname], {
    env: { ...process.env, PORT: '0' },
  });
  const [firstLine] = await once(child.stdout, 'data');
  const base = `http://localhost:${firstLine.toString().match(/localhost:(\d+)/)[1]}`;
  try {
    // While /slow-async waits on a timer, /fast is answered immediately
    const pendingAsync = timeRequest(base, '/slow-async');
    await new Promise((r) => setTimeout(r, 100));
    assert.ok((await timeRequest(base, '/fast')) < 500);
    await pendingAsync;

    // While /slow busy-waits, /fast has to wait for it
    const pendingSlow = timeRequest(base, '/slow');
    await new Promise((r) => setTimeout(r, 100));
    assert.ok((await timeRequest(base, '/fast')) > 1500);
    await pendingSlow;
  } finally {
    child.kill();
  }
});
