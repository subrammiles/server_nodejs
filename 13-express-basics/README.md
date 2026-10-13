# 13: Express basics

Lesson 08 built routing, body parsing and error handling by hand. **Express** (v5) does it in a few lines.

## The request pipeline
```
request -> app.use(middleware) ... -> route handler -> response
                                   \-> error? -> error handler (err, req, res, next)
no route matched -> 404 middleware
```

## Concepts
- **Middleware** `(req, res, next)`: logging, parsing, auth... Call `next()` or end the response.
  Order matters: registration order = execution order. A **middleware factory** (`requireApiKey(key)`) makes it configurable.
- Built-in middleware: `express.json()`, `express.urlencoded()`, `express.static()`.
- **Routing**: `app.get/post/put/patch/delete(path, ...handlers)`. Data arrives via `req.params` (always strings), `req.query`,
  `req.body` and `req.get(header)`.
- **Express 5 paths**: named wildcards `/*filePath`, optional segments `{/:year}`. The old regex-like strings
  (`/ab?cd`) from Express 4 no longer work.
- **Routers** (`express.Router()`): split routes into modules, with their own middleware, mounted under a prefix.
- **Responses**: `res.json`, `res.send`, `res.status(201)`, `res.set` / `res.location`, `res.redirect`, `res.type`. Respond **once**.
- **Async errors**: Express 5 forwards rejected promises to the error handler. No try/catch in every route.
- **404 and error handlers** go last. The error handler has **four** parameters and hides internal details (500).
- **`createApp()` vs `listen()`**: export the app without starting it, so tests (**supertest**) can call it in-process.

## Run
```bash
node 13-express-basics/server.js
curl localhost:3000/greet/te/Subbu
curl -H 'x-api-key: secret-key' localhost:3000/payments/balance
curl localhost:3000/async-fail
node --test "13-express-basics/*.test.js"
```
