import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fibonacci } from './fib-worker.js';
import { WorkerPool, fibonacciInWorker } from './workers.js';
import { spawnLines, sumInChildProcess } from './child-processes.js';

describe('worker threads', () => {
  it('compute in a worker while the main thread stays responsive', async () => {
    let ticks = 0;
    const timer = setInterval(() => ticks++, 5);
    const result = await fibonacciInWorker(32);
    clearInterval(timer);
    assert.equal(result, fibonacci(32));
    assert.ok(ticks > 3, `main thread ticked ${ticks} times while the worker computed`);
  });

  it('a pool reuses a fixed number of threads for many tasks', async () => {
    const pool = new WorkerPool(2);
    try {
      const results = await Promise.all([20, 21, 22, 23, 24].map((n) => pool.run(n)));
      assert.deepEqual(results, [6765, 10946, 17711, 28657, 46368]);
    } finally {
      await pool.close();
    }
  });
});

describe('child processes', () => {
  it('fork: compute in another Node process over IPC', async () => {
    assert.equal(await sumInChildProcess(100), 5050);
  });

  it('spawn: stream output of another program', async () => {
    const { code, lines } = await spawnLines('node', ['-e', 'console.log("a"); console.log("b")']);
    assert.equal(code, 0);
    assert.deepEqual(lines, ['a', 'b']);
  });
});

describe('cluster', () => {
  it('several worker processes share one port', { timeout: 20000 }, async () => {
    const probe = createServer().listen(0);
    await once(probe, 'listening');
    const port = probe.address().port;
    probe.close();

    const primary = spawn(process.execPath, [new URL('./cluster.js', import.meta.url).pathname], {
      env: { ...process.env, WORKERS: '2', PORT: String(port) },
    });
    try {
      let output = '';
      primary.stdout.on('data', (d) => { output += d; });
      while ((output.match(/listening/g) ?? []).length < 2) await new Promise((r) => setTimeout(r, 50));

      const pids = new Set();
      for (let i = 0; i < 20 && pids.size < 2; i++) {
        // a new connection per request so it can land on a different worker
        const res = await fetch(`http://localhost:${port}`, { headers: { connection: 'close' } });
        pids.add((await res.text()).match(/worker (\d+)/)[1]);
      }
      assert.equal(pids.size, 2);
    } finally {
      primary.kill('SIGTERM');
      await once(primary, 'exit');
    }
  });
});
