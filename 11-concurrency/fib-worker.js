// Runs INSIDE a worker thread: its own event loop and V8 isolate, so heavy CPU work here
// does not block the main thread.
import { parentPort, workerData } from 'node:worker_threads';

export function fibonacci(n) {
  return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);   // deliberately slow (exponential)
}

if (parentPort) {
  if (workerData !== undefined && workerData !== null) {
    parentPort.postMessage(fibonacci(workerData));   // one-shot mode
  } else {
    parentPort.on('message', (n) => parentPort.postMessage(fibonacci(n)));   // pool mode: reuse the thread
  }
}
