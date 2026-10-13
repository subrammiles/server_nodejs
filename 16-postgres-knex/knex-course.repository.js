// The lesson-14 repository interface again, now with the Knex QUERY BUILDER on PostgreSQL.
// Knex writes the SQL (with parameters) for you; .toString() on a query shows it.
const SORTS = {
  title: ['title', 'asc'], '-title': ['title', 'desc'],
  price: ['price', 'asc'], '-price': ['price', 'desc'],
  durationHours: ['duration_hours', 'asc'], '-durationHours': ['duration_hours', 'desc'],
};
const FIELDS = { title: 'title', category: 'category', durationHours: 'duration_hours', price: 'price' };

export class KnexCourseRepository {
  constructor(knex) {
    this.knex = knex;
  }

  #filtered({ category, q }) {
    const query = this.knex('courses');
    if (category) query.where({ category });
    if (q) query.whereILike('title', `%${q}%`);   // ILIKE = case-insensitive LIKE (PostgreSQL)
    return query;
  }

  async list({ category, q, page, size, sort }) {
    const [column, direction] = SORTS[sort];
    const [rows, [{ total }]] = await Promise.all([
      this.#filtered({ category, q }).select('*').orderBy(column, direction).limit(size).offset(page * size),
      this.#filtered({ category, q }).count({ total: '*' }),
    ]);
    return { items: rows.map(toCourse), total: Number(total) };
  }

  async findById(id) {
    return toCourse(await this.knex('courses').where({ id }).first());
  }

  async findByTitle(title) {
    return toCourse(await this.knex('courses').whereRaw('lower(title) = lower(?)', [title]).first());
  }

  async create(course) {
    const [row] = await this.knex('courses').insert(toRow(course)).returning('*');   // RETURNING: no extra SELECT
    return toCourse(row);
  }

  async update(id, changes) {
    const [row] = await this.knex('courses').where({ id }).update(toRow(changes)).returning('*');
    return toCourse(row);
  }

  async delete(id) {
    return (await this.knex('courses').where({ id }).delete()) === 1;
  }
}

function toRow(course) {
  return Object.fromEntries(Object.entries(course).filter(([k]) => FIELDS[k]).map(([k, v]) => [FIELDS[k], v]));
}

// pg returns NUMERIC as a string (to avoid losing precision) and timestamps as Date objects
function toCourse(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    durationHours: row.duration_hours,
    price: Number(row.price),
    createdAt: row.created_at.toISOString(),
  };
}
