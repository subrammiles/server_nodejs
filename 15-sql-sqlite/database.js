// node:sqlite: a SQLite database built into Node (no npm package, no server).
// SQLite stores the whole database in ONE file (or in memory). Great for learning, tests,
// CLI tools and small apps; use PostgreSQL/MySQL for multi-user servers (lesson 16).
import { DatabaseSync } from 'node:sqlite';
import { defaultCourses } from '../14-rest-api/src/courses/in-memory.repository.js';

// Versioned MIGRATIONS: each runs once, in order. The version is stored in the database itself.
const migrations = [
  `CREATE TABLE courses (
     id             INTEGER PRIMARY KEY AUTOINCREMENT,
     title          TEXT    NOT NULL,
     category       TEXT    NOT NULL,
     duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
     price          REAL    NOT NULL CHECK (price >= 0),
     created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
   );
   CREATE UNIQUE INDEX idx_courses_title ON courses (lower(title));`,
  `CREATE INDEX idx_courses_category ON courses (category);`,
];

export function openDatabase(file = ':memory:', { seed = true } = {}) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');

  const current = db.prepare('PRAGMA user_version').get().user_version;
  for (let version = current; version < migrations.length; version++) {
    db.exec('BEGIN');
    db.exec(migrations[version]);
    db.exec(`PRAGMA user_version = ${version + 1}`);
    db.exec('COMMIT');
  }

  if (seed && current === 0) {
    const insert = db.prepare('INSERT INTO courses (title, category, duration_hours, price) VALUES (?, ?, ?, ?)');
    for (const c of defaultCourses()) insert.run(c.title, c.category, c.durationHours, c.price);
  }
  return db;
}
