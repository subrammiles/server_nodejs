// A seed: known sample data for development and tests. Run: npx knex --knexfile ... seed:run
import { defaultCourses } from '../../14-rest-api/src/courses/in-memory.repository.js';

export async function seed(knex) {
  await knex.raw('TRUNCATE enrollments, students, courses RESTART IDENTITY CASCADE');
  await knex('courses').insert(defaultCourses().map((c) => ({
    title: c.title, category: c.category, duration_hours: c.durationHours, price: c.price,
  })));
  await knex('students').insert([
    { name: 'Subbu', email: 'subbu@example.com' },
    { name: 'Ravi', email: 'ravi@example.com' },
  ]);
  await knex('enrollments').insert([{ student_id: 1, course_id: 1 }]);
}
