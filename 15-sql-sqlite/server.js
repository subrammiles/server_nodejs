// The lesson-14 API, now backed by a SQLite file. Data survives restarts.
// Run: node 15-sql-sqlite/server.js
import { join } from 'node:path';
import { createApp } from '../14-rest-api/src/app.js';
import { openDatabase } from './database.js';
import { SqliteCourseRepository } from './sqlite-course.repository.js';

const file = process.env.DB_FILE ?? join(import.meta.dirname, 'courses.db');
const db = openDatabase(file);
const port = Number(process.env.PORT ?? 3000);

const server = createApp({ courseRepository: new SqliteCourseRepository(db) })
  .listen(port, () => console.log(`API on http://localhost:${port}/api/courses (database: ${file})`));

process.on('SIGINT', () => server.close(() => { db.close(); process.exit(0); }));
