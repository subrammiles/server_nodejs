// The lesson-14 API on PostgreSQL.
//   docker compose -f 16-postgres-knex/docker-compose.yml up -d
//   node --env-file=16-postgres-knex/.env.example 16-postgres-knex/server.js
import knexFactory from 'knex';
import { createApp } from '../14-rest-api/src/app.js';
import { knexConfig } from './knexfile.js';
import { KnexCourseRepository } from './knex-course.repository.js';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (see 16-postgres-knex/.env.example)');
  process.exit(1);
}

const knex = knexFactory(knexConfig());
await knex.migrate.latest();   // apply pending migrations at startup (many teams run them as a separate deploy step)
if ((await knex('courses').count({ n: '*' }))[0].n === '0') await knex.seed.run();

const port = Number(process.env.PORT ?? 3000);
const server = createApp({ courseRepository: new KnexCourseRepository(knex) })
  .listen(port, () => console.log(`API on http://localhost:${port}/api/courses (PostgreSQL)`));

process.on('SIGINT', () => server.close(async () => {
  await knex.destroy();   // close the connection pool
  process.exit(0);
}));
