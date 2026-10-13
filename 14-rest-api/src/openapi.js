// OpenAPI 3 description of the API, served as JSON and rendered by Swagger UI at /docs.
const course = {
  type: 'object',
  properties: {
    id: { type: 'integer' }, title: { type: 'string' }, category: { type: 'string' },
    durationHours: { type: 'integer' }, price: { type: 'number' }, createdAt: { type: 'string', format: 'date-time' },
  },
};
const courseInput = {
  type: 'object',
  required: ['title', 'category', 'durationHours', 'price'],
  properties: { title: { type: 'string' }, category: { type: 'string' }, durationHours: { type: 'integer' }, price: { type: 'number' } },
};
const problem = { description: 'Error (RFC 9457 problem details)', content: { 'application/problem+json': { schema: { type: 'object' } } } };
const id = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };

export const openApiDocument = {
  openapi: '3.1.0',
  info: { title: 'Course API', version: '1.0.0' },
  paths: {
    '/api/courses': {
      get: {
        summary: 'Search courses',
        parameters: ['category', 'q', 'page', 'size', 'sort'].map((name) => ({ name, in: 'query', schema: { type: 'string' } })),
        responses: { 200: { description: 'A page of courses' }, 400: problem },
      },
      post: {
        summary: 'Create a course',
        requestBody: { required: true, content: { 'application/json': { schema: courseInput } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: course } } }, 400: problem, 409: problem },
      },
    },
    '/api/courses/{id}': {
      get: { summary: 'Get a course', parameters: [id], responses: { 200: { description: 'The course' }, 404: problem } },
      put: { summary: 'Replace a course', parameters: [id], requestBody: { content: { 'application/json': { schema: courseInput } } }, responses: { 200: { description: 'Updated' }, 404: problem } },
      patch: { summary: 'Update some fields', parameters: [id], responses: { 200: { description: 'Updated' }, 404: problem } },
      delete: { summary: 'Delete a course', parameters: [id], responses: { 204: { description: 'Deleted' }, 404: problem } },
    },
  },
};
