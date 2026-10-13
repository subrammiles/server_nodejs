// Which callback runs first? Run: node 03-event-loop/order.js
import { readFile } from 'node:fs';

// Everything is scheduled from inside an I/O callback, i.e. from a normal event-loop phase.
// That gives the textbook, deterministic order.
export function recordOrder() {
  return new Promise((resolve) => {
    readFile(import.meta.filename, () => {
      const order = [];
      const log = (label) => order.push(label);

      log('1 sync code');
      setTimeout(() => log('timers: setTimeout 0'), 0);
      setImmediate(() => log('check: setImmediate'));
      Promise.resolve().then(() => log('microtask: promise.then'));
      queueMicrotask(() => log('microtask: queueMicrotask'));
      process.nextTick(() => log('nextTick queue'));
      log('2 sync code');

      setTimeout(() => resolve(order), 20);
    });
  });
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  (await recordOrder()).forEach((step, i) => console.log(String(i + 1).padStart(2), step));

  // NUANCE: the top level of an ES module is itself evaluated inside a promise job,
  // so here promise callbacks run BEFORE process.nextTick. Don't rely on nextTick ordering in ESM top-level code.
  process.nextTick(() => console.log('\nESM top level: nextTick ran second'));
  Promise.resolve().then(() => console.log('\nESM top level: promise ran first'));
}
