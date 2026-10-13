# 06: Buffers and streams

## Buffers
A `Buffer` is raw binary data (bytes). Convert with encodings: `utf8`, `hex`, `base64`.
Remember that string length is not byte length (`Buffer.byteLength('నమస్తే')`).

## Streams
Reading a 5 GB file with `readFile` needs 5 GB of RAM. A stream handles it in small chunks (64 KB by default).

| Type | Example |
|---|---|
| Readable | `fs.createReadStream`, HTTP request, `process.stdin` |
| Writable | `fs.createWriteStream`, HTTP response, `process.stdout` |
| Duplex | TCP socket |
| Transform | `zlib.createGzip`, your own (`transforms.js`) |

## Concepts
- **`pipeline()`** (from `node:stream/promises`): connects streams, propagates errors and **destroys every stream**
  on failure. Prefer it to `.pipe()`, which doesn't clean up on errors.
- **Backpressure**: if the writer is slower than the reader, `pipeline` pauses the reader so memory stays bounded.
- **Object mode**: streams of objects (`splitLines`, `csvToObjects`) instead of bytes.
- **Async iteration**: `for await (const chunk of readable)`, the simplest way to consume a stream.
- **`readline`**: process a file line by line.
- `Readable.from(iterable)`: turn arrays and generators into streams (great for tests).
- Lesson 08 streams a file straight into an HTTP response.

## Run
```bash
node 06-streams/demo.js
node --test "06-streams/*.test.js"
```
