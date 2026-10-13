// A ROUTER is a mini-app with its own routes and middleware, mounted at a path (from the old repo).
import { Router } from 'express';

const users = new Map([[1, { id: 1, name: 'Subbu' }], [2, { id: 2, name: 'Ravi' }]]);
export const usersRouter = Router();

// Router-level middleware: only for /users/*
usersRouter.use((req, res, next) => {
  res.set('X-Router', 'users');
  next();
});

usersRouter.get('/', (req, res) => res.json([...users.values()]));

// Route parameter :id -> req.params.id (always a STRING)
usersRouter.get('/:id', (req, res) => {
  const user = users.get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: `User ${req.params.id} not found` });
  res.json(user);
});

usersRouter.post('/', (req, res) => {
  const id = users.size + 1;
  const user = { id, name: req.body.name };
  users.set(id, user);
  res.status(201).location(`/users/${id}`).json(user);
});
