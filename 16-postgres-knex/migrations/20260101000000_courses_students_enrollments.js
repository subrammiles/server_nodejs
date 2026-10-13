// A Knex migration: `up` applies the change, `down` reverts it. Knex records applied ones in knex_migrations.
export async function up(knex) {
  await knex.schema.createTable('courses', (t) => {
    t.increments('id');                                   // SERIAL PRIMARY KEY
    t.string('title', 100).notNullable();
    t.string('category', 50).notNullable().index();
    t.integer('duration_hours').notNullable().checkPositive();
    t.decimal('price', 10, 2).notNullable().checkPositive();
    t.integer('capacity').notNullable().defaultTo(30);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw('CREATE UNIQUE INDEX courses_title_unique ON courses (lower(title))');

  await knex.schema.createTable('students', (t) => {
    t.increments('id');
    t.string('name', 100).notNullable();
    t.string('email', 255).notNullable().unique();
  });

  // Many-to-many join table with FOREIGN KEYS: the database rejects enrolments for missing students/courses
  await knex.schema.createTable('enrollments', (t) => {
    t.integer('student_id').notNullable().references('students.id').onDelete('CASCADE');
    t.integer('course_id').notNullable().references('courses.id').onDelete('CASCADE');
    t.timestamp('enrolled_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.primary(['student_id', 'course_id']);              // a student can't enrol twice in one course
  });
}

export async function down(knex) {
  await knex.schema.dropTable('enrollments');
  await knex.schema.dropTable('students');
  await knex.schema.dropTable('courses');
}
