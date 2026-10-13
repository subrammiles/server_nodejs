// SERVICE: business rules. Knows nothing about HTTP (no req/res) and nothing about SQL.
import { ConflictError, NotFoundError } from '../errors.js';

export class CourseService {
  constructor(repository) {
    this.repository = repository;
  }

  async list(query) {
    const { items, total } = await this.repository.list(query);
    return { items, page: { number: query.page, size: query.size, totalElements: total, totalPages: Math.ceil(total / query.size) } };
  }

  async get(id) {
    const course = await this.repository.findById(id);
    if (!course) throw new NotFoundError(`Course ${id} not found`);
    return course;
  }

  async create(data) {
    await this.#assertTitleFree(data.title);
    return this.repository.create(data);
  }

  async update(id, data) {
    await this.get(id);
    if (data.title) await this.#assertTitleFree(data.title, id);
    return this.repository.update(id, data);
  }

  async delete(id) {
    if (!(await this.repository.delete(id))) throw new NotFoundError(`Course ${id} not found`);
  }

  async #assertTitleFree(title, exceptId) {
    const existing = await this.repository.findByTitle(title);
    if (existing && existing.id !== exceptId) throw new ConflictError(`A course titled "${title}" already exists`);
  }
}
