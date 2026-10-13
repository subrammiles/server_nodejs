// The lesson-14 repository interface, implemented with SQL.
const COLUMNS = 'id, title, category, duration_hours AS durationHours, price, created_at AS createdAt';

// Column names cannot be query parameters, so ORDER BY must come from a WHITELIST
// (never from raw user input: that would be SQL injection).
const SORTS = {
  title: 'title ASC', '-title': 'title DESC',
  price: 'price ASC', '-price': 'price DESC',
  durationHours: 'duration_hours ASC', '-durationHours': 'duration_hours DESC',
};

const FIELDS = { title: 'title', category: 'category', durationHours: 'duration_hours', price: 'price' };

export class SqliteCourseRepository {
  constructor(db) {
    this.db = db;
    // PREPARED STATEMENTS: SQL compiled once, values bound separately. Safe AND fast.
    this.byId = db.prepare(`SELECT ${COLUMNS} FROM courses WHERE id = ?`);
    this.byTitle = db.prepare(`SELECT ${COLUMNS} FROM courses WHERE lower(title) = lower(?)`);
    this.insert = db.prepare('INSERT INTO courses (title, category, duration_hours, price) VALUES (:title, :category, :durationHours, :price)');
    this.remove = db.prepare('DELETE FROM courses WHERE id = ?');
  }

  async list({ category, q, page, size, sort }) {
    const where = [];
    const params = [];
    if (category) { where.push('category = ?'); params.push(category); }
    if (q) { where.push('title LIKE ?'); params.push(`%${q}%`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const items = this.db.prepare(`SELECT ${COLUMNS} FROM courses ${whereSql} ORDER BY ${SORTS[sort]} LIMIT ? OFFSET ?`)
      .all(...params, size, page * size);
    const { total } = this.db.prepare(`SELECT COUNT(*) AS total FROM courses ${whereSql}`).get(...params);
    return { items: items.map(toPlain), total };
  }

  async findById(id) {
    return toPlain(this.byId.get(id));
  }

  async findByTitle(title) {
    return toPlain(this.byTitle.get(title));
  }

  async create(course) {
    const { lastInsertRowid } = this.insert.run(course);   // named parameters from the object
    return this.findById(Number(lastInsertRowid));
  }

  async update(id, changes) {
    const entries = Object.entries(changes).filter(([key]) => FIELDS[key]);
    if (entries.length) {
      const set = entries.map(([key]) => `${FIELDS[key]} = ?`).join(', ');
      const { changes: count } = this.db.prepare(`UPDATE courses SET ${set} WHERE id = ?`).run(...entries.map(([, v]) => v), id);
      if (count === 0) return null;
    }
    return this.findById(id);
  }

  async delete(id) {
    return this.remove.run(id).changes === 1;
  }

  // TRANSACTION: import many courses, all or nothing
  async importAll(courses) {
    this.db.exec('BEGIN');
    try {
      const created = courses.map((c) => Number(this.insert.run(c).lastInsertRowid));
      this.db.exec('COMMIT');
      return created.length;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

// node:sqlite returns null-prototype objects; convert to plain objects (and undefined -> null)
function toPlain(row) {
  return row ? { ...row } : null;
}
