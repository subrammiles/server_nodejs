import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { CourseService } from './courses/course.service.js';
import { courseRoutes } from './courses/course.routes.js';
import { InMemoryCourseRepository } from './courses/in-memory.repository.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { openApiDocument } from './openapi.js';

// DEPENDENCY INJECTION by hand: the caller decides which repository to use.
// Tests and lessons 15/16 pass a different one; the rest of the app is unchanged.
export function createApp({ courseRepository = new InMemoryCourseRepository() } = {}) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/courses', courseRoutes(new CourseService(courseRepository)));

  app.get('/openapi.json', (req, res) => res.json(openApiDocument));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
