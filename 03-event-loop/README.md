# 03: The event loop

One thread runs all your JavaScript. **libuv** does I/O in the background (OS async APIs plus a thread pool for
files, DNS and crypto) and queues the callbacks. The **event loop** runs them one at a time.

```
   ┌──────────── timers          setTimeout / setInterval
   │   pending callbacks         some system errors
   │   poll                      new I/O events (sockets, files) <- most time is spent here
   │   check                     setImmediate
   └── close callbacks           socket.on('close')
   Between every callback: process.nextTick queue, then the promise (microtask) queue
```

## Rules of thumb
- Synchronous code always finishes first. Then `process.nextTick`, then promise callbacks, then the next loop phase.
  (Exception: at the **top level of an ES module**, promise callbacks run before `nextTick`, because the module itself
  is evaluated inside a promise job. `order.js` prints both cases.)
- **Never block the loop**: a 2-second `while` loop (or a huge `JSON.parse`, sync crypto, `fs.readFileSync` in a
  request handler) freezes **every** user. `blocking-server.js` proves it, and the test measures it.
- Waiting (timers, I/O, `await fetch`) is **not** blocking.
- Fixes for CPU-heavy work: worker threads, child processes, cluster (lesson 11), or move it to a queue or another service.
- Node is great for I/O-heavy servers (APIs, proxies, realtime) and a poor fit for CPU-heavy work on the main thread.

## Run
```bash
node 03-event-loop/order.js
node 03-event-loop/blocking-server.js     # then in another terminal:
curl localhost:3000/slow & sleep 0.2; time curl localhost:3000/fast
node --test "03-event-loop/*.test.js"
```
