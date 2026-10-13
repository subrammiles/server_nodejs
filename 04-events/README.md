# 04: Events (EventEmitter)

`EventEmitter` is Node's built-in observer pattern: objects **emit** named events and listeners **react**.
HTTP servers (`'request'`), streams (`'data'`, `'end'`), sockets and processes (`'exit'`, `'SIGTERM'`) are all emitters.

## Concepts
- `on` / `once` / `off` (`removeListener`) / `emit` / `listenerCount`.
- Listeners run **synchronously** and in order. `emit` returns after all of them.
- **The `'error'` event is special**: emitting it with no listener throws. Always handle `'error'` on streams, sockets and servers.
- `events.once(emitter, name)` gives a promise. `events.on(emitter, name)` gives an async iterator (stop it with an `AbortSignal`).
- Too many listeners (more than 10 by default) prints a warning, which usually means a memory leak from forgetting `off`.
- `TinyEmitter`: a 20-line hand-written emitter (from the old repo) that shows how it works.

Events are for loose coupling **inside one process**. To communicate between services, use a message broker
(Kafka, RabbitMQ, SQS: see lesson 20 and the `server_kafka` repo).

## Run
```bash
node 04-events/demo.js
node --test "04-events/*.test.js"
```
