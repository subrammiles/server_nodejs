# 16: PostgreSQL with Knex (migrations, joins, transactions, locking)

Production servers use a database **server** such as PostgreSQL. **Knex** is a query builder: it generates
parameterised SQL from JavaScript and adds migrations, seeds and connection pooling.

## Concepts
- **Configuration from env vars** (`DATABASE_URL`). Never commit credentials. The old version of this repo had a
  password in its knexfile.
- **Connection pool**: reuse a few connections instead of opening one per request. Close it on shutdown (`knex.destroy()`).
- **Migrations** with `up`/`down` (`npx knex migrate:latest | rollback | make <name>`) and **seeds** for sample data.
- **Relational design**: `students` *-* `courses` through `enrollments`, with **foreign keys** (`references`,
  `onDelete('CASCADE')`), a composite primary key, unique and check constraints.
- **Query builder**: `where`, `whereILike`, `orderBy`, `limit/offset`, `count`, `insert ... returning('*')`.
- **Joins**: `INNER JOIN` (students in a course), `LEFT JOIN` + `GROUP BY` (counts including zero).
- **Transactions**: `knex.transaction(async (trx) => ...)` commits on success and rolls back on throw.
- **Race conditions and row locks**: `SELECT ... FOR UPDATE` stops two concurrent requests from taking the last seat.
  The test fires two enrolments at once and asserts that exactly one wins.
- **Type mapping**: `pg` returns `NUMERIC` as strings and timestamps as `Date`. Convert at the repository boundary.
- **Same repository contract** as lessons 14/15, so the REST API runs on PostgreSQL unchanged.
- **Testcontainers**: the tests start a real `postgres:17-alpine` in Docker and throw it away afterwards.
- ORMs (Prisma, Drizzle, TypeORM, Sequelize, Objection) sit on top of these ideas.

## Run
```bash
docker compose -f 16-postgres-knex/docker-compose.yml up -d --wait     # PostgreSQL on localhost:55432
node --env-file=16-postgres-knex/.env.example node_modules/.bin/knex --knexfile 16-postgres-knex/knexfile.js migrate:latest
node --env-file=16-postgres-knex/.env.example 16-postgres-knex/server.js
curl 'localhost:3000/api/courses?sort=-price'
node --test "16-postgres-knex/*.test.js"      # needs Docker, skipped otherwise
```
