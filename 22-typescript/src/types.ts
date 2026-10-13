// TYPES describe the SHAPE of data. They exist only at compile time and are erased before running.

export type CourseId = number;

// Union of literal types: like an enum, but erasable
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Course {
  readonly id: CourseId;        // readonly: can't be reassigned after creation
  title: string;
  level: Level;
  price: number;
  tags?: string[];              // optional property
}

// Utility types derive new types from existing ones
export type NewCourse = Omit<Course, 'id'>;
export type CoursePatch = Partial<NewCourse>;

// A DISCRIMINATED UNION: model "success OR failure" so callers MUST handle both
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };
