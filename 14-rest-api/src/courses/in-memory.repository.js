// REPOSITORY: the only layer that knows where data lives. This one uses a Map.
// Lessons 15 (SQLite) and 16 (PostgreSQL) implement the SAME methods, so the service and routes don't change.
export class InMemoryCourseRepository {
  #courses = new Map();
  #nextId = 1;

  constructor(seed = defaultCourses()) {
    seed.forEach((c) => this.create(c));
  }

  async list({ category, q, page, size, sort }) {
    const desc = sort.startsWith('-');
    const key = desc ? sort.slice(1) : sort;
    const matches = [...this.#courses.values()]
      .filter((c) => !category || c.category === category)
      .filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (desc ? -1 : 1));
    return { items: matches.slice(page * size, page * size + size), total: matches.length };
  }

  async findById(id) {
    return this.#courses.get(id) ?? null;
  }

  async findByTitle(title) {
    return [...this.#courses.values()].find((c) => c.title.toLowerCase() === title.toLowerCase()) ?? null;
  }

  async create(data) {
    const course = { id: this.#nextId++, ...data, createdAt: new Date().toISOString() };
    this.#courses.set(course.id, course);
    return course;
  }

  async update(id, data) {
    const current = this.#courses.get(id);
    if (!current) return null;
    const updated = { ...current, ...data };
    this.#courses.set(id, updated);
    return updated;
  }

  async delete(id) {
    return this.#courses.delete(id);
  }
}

export function defaultCourses() {
  return [
    { title: 'Node.js Fundamentals', category: 'backend', durationHours: 12, price: 1999 },
    { title: 'Data Structures and Algorithms', category: 'cs', durationHours: 40, price: 2999 },
    { title: 'REST API Design', category: 'backend', durationHours: 8, price: 999 },
  ];
}
