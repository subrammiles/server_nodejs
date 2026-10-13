# 14: A production-style REST API

The course catalog API (the same domain as the Spring Boot repo), structured the way real Node services are.

```
src/
  app.js                        createApp({ courseRepository }): wiring + error handling
  errors.js                     AppError, NotFoundError, ConflictError, ValidationError, problem+json
  openapi.js                    API description for /docs
  middleware/validate.js        Zod validation for body / query / params
  courses/
    course.routes.js            HTTP layer: parse, call service, respond
    course.service.js           business rules (unique titles, not found), no HTTP, no SQL
    in-memory.repository.js     data access, swappable (see lessons 15 and 16)
    course.schemas.js           Zod schemas
```

## Concepts
- **Layered architecture**: routes, then service, then repository. Each layer has one job and can be tested alone
  (`service.test.js` uses no HTTP at all).
- **Dependency injection** without a framework: `createApp({ courseRepository })`. Lessons 15/16 pass a SQLite or
  PostgreSQL repository and nothing else changes.
- **Validation with Zod**: parse, coerce (`"2"` becomes `2`), set defaults, reject unknown fields (`.strict()`),
  and validate **body, query and path params**. Never trust client input.
- **REST conventions**: plural nouns, correct verbs and status codes (200, 201 + `Location`, 204, 400, 404, 409),
  PUT (replace) vs PATCH (partial update), paging with metadata, `sort=-price`.
- **Errors as RFC 9457 problem+json**, one consistent shape everywhere. 500s reveal nothing internal.
- **OpenAPI + Swagger UI** at `/docs` (from the old repo's swagger example, now actually wired up).
- **Integration tests** with supertest, plus **unit tests** for the service.

## Run
```bash
node 14-rest-api/server.js
curl 'localhost:3000/api/courses?category=backend&sort=-price'
curl -i -X POST localhost:3000/api/courses -H 'Content-Type: application/json' \
     -d '{"title":"Docker","category":"devops","durationHours":6,"price":799}'
curl -i -X POST localhost:3000/api/courses -H 'Content-Type: application/json' -d '{"title":""}'
open http://localhost:3000/docs
node --test "14-rest-api/test/*.test.js"
```
