// Proof that CPU-heavy code blocks EVERY request. (Ported from the old while-loop example.)
// Run: node 03-event-loop/blocking-server.js
// Then: curl localhost:3000/slow & curl localhost:3000/fast   -> /fast waits for /slow!
import { createServer } from 'node:http';

export function busyWait(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // the event loop is stuck here: no other request, timer or I/O callback can run
  }
}

export function createBlockingServer() {
  return createServer((req, res) => {
    if (req.url === '/slow') {
      busyWait(2000);
      return res.end('slow: blocked the event loop for 2 s\n');
    }
    if (req.url === '/slow-async') {
      // Waiting is NOT blocking: a timer lets the loop serve other requests meanwhile
      return setTimeout(() => res.end('slow-async: waited 2 s without blocking\n'), 2000);
    }
    res.end('fast\n');
  });
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  const server = createBlockingServer().listen(Number(process.env.PORT ?? 3000), () => {
    console.log(`listening on http://localhost:${server.address().port}  (/fast, /slow, /slow-async)`);
  });
}
