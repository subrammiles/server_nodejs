// Run: node 15-sql-sqlite/sql-injection.js
// SQL INJECTION: the #1 classic web vulnerability. Watch it happen, then the fix.
import { openDatabase } from './database.js';

const db = openDatabase();

export function findUnsafe(db, title) {
  // NEVER DO THIS: user input pasted into the SQL text
  return db.prepare(`SELECT title FROM courses WHERE title = '${title}'`).all().map((r) => r.title);
}

export function findSafe(db, title) {
  // Parameters are sent separately from the SQL, so they can never change its meaning
  return db.prepare('SELECT title FROM courses WHERE title = ?').all(title).map((r) => r.title);
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  const attack = "nothing' OR '1'='1";
  console.log('input       :', attack);
  console.log('unsafe query:', findUnsafe(db, attack), '<- the attacker read EVERY row');
  console.log('safe query  :', findSafe(db, attack), '<- treated as a plain (non-matching) title');
}
