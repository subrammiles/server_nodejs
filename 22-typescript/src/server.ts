// A typed Express API. Run directly with Node (no build step): node 22-typescript/src/server.ts
import express, { type Request, type Response } from 'express';
import { CourseCatalog, isLevel } from './course-catalog.ts';
import type { Course, NewCourse } from './types.ts';

export function createApp(catalog = new CourseCatalog()) {
  const app = express();
  app.use(express.json());

  // Request<Params, ResponseBody, RequestBody, Query>: handlers get typed req and res
  app.get('/courses', (req: Request<{}, Course[] | { error: string }, unknown, { level?: string }>, res) => {
    const { level } = req.query;
    if (level === undefined) return res.json(catalog.byLevel('beginner').concat(catalog.byLevel('intermediate'), catalog.byLevel('advanced')));
    if (!isLevel(level)) return res.status(400).json({ error: `unknown level ${level}` });
    res.json(catalog.byLevel(level));   // here `level` is narrowed to the Level type
  });

  app.post('/courses', (req: Request<{}, unknown, Partial<NewCourse>>, res: Response) => {
    const { title, level, price } = req.body;
    // Types don't validate data at RUNTIME: JSON from clients can be anything. Check it (or use Zod, lesson 14).
    if (typeof title !== 'string' || !isLevel(level) || typeof price !== 'number') {
      return res.status(400).json({ error: 'title, level and price are required' });
    }
    const result = catalog.add({ title, level, price });
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.status(201).json(result.value);
  });

  return app;
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => console.log(`typed API on http://localhost:${port}/courses`));
}
