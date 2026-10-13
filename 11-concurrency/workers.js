import { Worker } from 'node:worker_threads';
import { availableParallelism } from 'node:os';

const WORKER_FILE = new URL('./fib-worker.js', import.meta.url);

// One-shot: start a thread, get one result, thread exits. Simple, but starting a thread costs ~30 ms.
export function fibonacciInWorker(n) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_FILE, { workerData: n });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => code !== 0 && reject(new Error(`worker exited with ${code}`)));
  });
}

// A fixed-size POOL of reusable threads with a queue (what libraries like piscina do).
export class WorkerPool {
  #idle = [];
  #queue = [];
  #all = [];

  constructor(size = availableParallelism()) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(WORKER_FILE);
      this.#all.push(worker);
      this.#idle.push(worker);
    }
  }

  run(n) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ n, resolve, reject });
      this.#dispatch();
    });
  }

  #dispatch() {
    while (this.#idle.length && this.#queue.length) {
      const worker = this.#idle.pop();
      const { n, resolve, reject } = this.#queue.shift();
      const onMessage = (result) => {
        worker.off('error', onError);
        this.#idle.push(worker);
        resolve(result);
        this.#dispatch();
      };
      const onError = (err) => {
        worker.off('message', onMessage);
        reject(err);
      };
      worker.once('message', onMessage);
      worker.once('error', onError);
      worker.postMessage(n);
    }
  }

  async close() {
    await Promise.all(this.#all.map((w) => w.terminate()));
  }
}
