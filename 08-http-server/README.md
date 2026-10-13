# 08: An HTTP server with no framework

Before Express, see what HTTP really looks like in Node. `server.js` is a small JSON API plus a static file server,
using only `node:http`.

## Concepts
- `http.createServer((req, res) => ...)`: `req` is a **readable stream** (the body), `res` a **writable stream**.
- **Routing** = matching `req.method` + the URL path. `new URL(req.url, base)` parses the path and the `?query`.
- **Request bodies** arrive in chunks. Collect them, enforce a **size limit** (413), check `Content-Type` (415),
  and parse JSON safely (400).
- **Responses**: `writeHead(status, headers)` + `end(body)`. Correct status codes: 200, 201 + `Location`, 204, 400, 404, 405, 413, 415, 500.
- **Central error handling**: one `try/catch` maps errors to responses and never leaks stack traces (500).
- **Static files** streamed with `pipeline` and guarded against path traversal.
- **Logging** each request on `res.on('finish')`.
- **Port 0** in tests = "any free port". `fetch` is built into Node, so no client library is needed.

Doing all this by hand is error-prone. Frameworks like Express (next lessons) handle routing, body parsing and errors for you.

## Run
```bash
node 08-http-server/server.js
curl localhost:3000/api/books
curl -i -X POST localhost:3000/api/books -H 'Content-Type: application/json' -d '{"title":"Learning Node"}'
open http://localhost:3000/
node --test "08-http-server/*.test.js"
```
