// JOINS and TRANSACTIONS WITH LOCKING: the parts of databases that matter under real load.
export class CourseFullError extends Error {}

export class EnrollmentService {
  constructor(knex) {
    this.knex = knex;
  }

  // Two students hit "enrol" for the LAST seat at the same moment. Without a lock both read
  // "1 seat left" and both insert: the course is overbooked (a race condition).
  // SELECT ... FOR UPDATE locks the course row until the transaction ends, so the second
  // request waits, then sees the seat is gone.
  async enroll(studentId, courseId) {
    return this.knex.transaction(async (trx) => {
      const course = await trx('courses').where({ id: courseId }).forUpdate().first();
      if (!course) throw new Error(`Course ${courseId} not found`);
      const [{ taken }] = await trx('enrollments').where({ course_id: courseId }).count({ taken: '*' });
      if (Number(taken) >= course.capacity) throw new CourseFullError(`Course ${courseId} is full`);
      await trx('enrollments').insert({ student_id: studentId, course_id: courseId });
      return { studentId, courseId, seatsLeft: course.capacity - Number(taken) - 1 };
    });   // commit if the function resolves, rollback if it throws
  }

  // INNER JOIN across the many-to-many relationship
  async studentsIn(courseId) {
    return this.knex('students as s')
      .join('enrollments as e', 'e.student_id', 's.id')
      .where('e.course_id', courseId)
      .orderBy('s.name')
      .select('s.id', 's.name', 's.email');
  }

  // LEFT JOIN + GROUP BY: every course, even with zero students
  async enrollmentCounts() {
    const rows = await this.knex('courses as c')
      .leftJoin('enrollments as e', 'e.course_id', 'c.id')
      .groupBy('c.id', 'c.title')
      .orderBy('c.id')
      .select('c.title')
      .count({ students: 'e.student_id' });
    return rows.map((r) => ({ title: r.title, students: Number(r.students) }));
  }
}
