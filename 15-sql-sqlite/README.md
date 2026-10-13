# 15: SQL databases (with the built-in SQLite)

Relational databases store data in **tables** and are queried with **SQL**. `node:sqlite` is built into Node,
so this lesson needs no server and no npm package.

## Concepts
- **Schema** with types and **constraints** (`NOT NULL`, `CHECK`, `UNIQUE` index). The database enforces rules,
  which is safer than only checking in JavaScript.
- **Migrations** (`database.js`): numbered schema changes that run once each. The version is stored in `PRAGMA user_version`.
  Never edit an applied migration, add a new one.
- **CRUD in SQL**: `SELECT ... WHERE ... ORDER BY ... LIMIT/OFFSET`, `INSERT`, `UPDATE`, `DELETE`, `COUNT(*)`.
- **Prepared statements and parameters** (`?`, `:name`): compiled once, values bound separately.
- **SQL injection** (`sql-injection.js`): concatenating input into SQL lets an attacker rewrite the query. **Always use parameters.**
  Identifiers (column names, sort direction) can't be parameters, so take them from a whitelist (`SORTS`).
- **Transactions** (`importAll`): `BEGIN` ... `COMMIT`, or `ROLLBACK` on error. All or nothing.
- **Repository pattern payoff**: `SqliteCourseRepository` implements lesson 14's interface, so the whole API runs on SQLite
  without touching routes or services. The **contract test** (`14-rest-api/test/repository-contract.js`) proves it.
- Mapping `snake_case` columns to `camelCase` fields (`duration_hours AS durationHours`).

`node:sqlite` needs Node 22.13+ (no flag). It is still evolving, so check the Node docs when upgrading.
SQLite handles one writer at a time, which is fine for small apps and tests. Multi-user servers use PostgreSQL or MySQL (next lesson).

## Run
```bash
node 15-sql-sqlite/sql-injection.js
node 15-sql-sqlite/server.js        # creates 15-sql-sqlite/courses.db (git-ignored)
node --test "15-sql-sqlite/*.test.js"
```
