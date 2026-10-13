// ROUTES (controller layer): HTTP in, HTTP out. Validation happens before the handler runs.
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { courseInput, coursePatch, idParams, listQuery } from './course.schemas.js';

export function courseRoutes(service) {
  const router = Router();

  router.get('/', validate({ query: listQuery }), async (req, res) => {
    res.json(await service.list(req.valid.query));
  });

  router.get('/:id', validate({ params: idParams }), async (req, res) => {
    res.json(await service.get(req.valid.params.id));
  });

  router.post('/', validate({ body: courseInput }), async (req, res) => {
    const course = await service.create(req.valid.body);
    res.status(201).location(`${req.baseUrl}/${course.id}`).json(course);
  });

  router.put('/:id', validate({ params: idParams, body: courseInput }), async (req, res) => {
    res.json(await service.update(req.valid.params.id, req.valid.body));
  });

  router.patch('/:id', validate({ params: idParams, body: coursePatch }), async (req, res) => {
    res.json(await service.update(req.valid.params.id, req.valid.body));
  });

  router.delete('/:id', validate({ params: idParams }), async (req, res) => {
    await service.delete(req.valid.params.id);
    res.status(204).end();
  });

  return router;
}
