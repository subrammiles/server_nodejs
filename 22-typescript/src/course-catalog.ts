import type { Course, CourseId, CoursePatch, Level, NewCourse, Result } from './types.ts';

// GENERICS: one class that works for any entity type that has a numeric id
export class InMemoryStore<T extends { id: number }> {
  #items = new Map<number, T>();

  save(item: T): T {
    this.#items.set(item.id, item);
    return item;
  }

  find(id: number): T | undefined {   // the return type admits "might be missing"
    return this.#items.get(id);
  }

  all(): T[] {
    return [...this.#items.values()];
  }
}

const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced'];

// TYPE GUARD: a runtime check that also narrows the static type
export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && (LEVELS as readonly string[]).includes(value);
}

export class CourseCatalog {
  #store = new InMemoryStore<Course>();
  #nextId: CourseId = 1;

  add(input: NewCourse): Result<Course> {
    if (input.price < 0) return { ok: false, error: 'price must not be negative' };
    return { ok: true, value: this.#store.save({ id: this.#nextId++, ...input }) };
  }

  update(id: CourseId, patch: CoursePatch): Result<Course> {
    const current = this.#store.find(id);
    if (!current) return { ok: false, error: `course ${id} not found` };   // the compiler forces this check
    return { ok: true, value: this.#store.save({ ...current, ...patch }) };
  }

  byLevel(level: Level): Course[] {
    return this.#store.all().filter((c) => c.level === level);
  }

  averagePrice(): number | null {
    const courses = this.#store.all();
    if (courses.length === 0) return null;
    return courses.reduce((sum, c) => sum + c.price, 0) / courses.length;
  }
}
