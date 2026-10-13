import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { authenticate, requireRole } from './auth-middleware.js';

const registration = z.object({
  email: z.email().max(255),
  password: z.string().min(10, 'Use at least 10 characters').max(200),
  name: z.string().trim().min(1).max(100),
}).strict();   // .strict(): a client can NOT send {"role":"admin"} to make itself admin

const login = z.object({ email: z.string(), password: z.string() });

export function createApp({ users, tokens, allowedOrigins = ['http://localhost:5173'], loginLimit = 5 }) {
  const app = express();

  // Security headers: no MIME sniffing, clickjacking protection, a strict CSP, no "X-Powered-By: Express"...
  app.use(helmet());

  // CORS: which BROWSER origins may call this API. (Not a security boundary for curl or other servers.)
  app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'], allowedHeaders: ['Authorization', 'Content-Type'] }));
  app.use(express.json({ limit: '10kb' }));

  // RATE LIMITING: slow down password guessing (in production, store counters in Redis so all instances share them)
  const loginLimiter = rateLimit({ windowMs: 60_000, limit: loginLimit, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many login attempts, try again later' } });

  app.post('/auth/register', async (req, res) => {
    const parsed = registration.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid registration', issues: parsed.error.issues.map((i) => i.message) });
    const user = await users.register(parsed.data);   // role is always "user"
    if (!user) return res.status(409).json({ error: 'Email already registered' });
    res.status(201).json(user);
  });

  app.post('/auth/login', loginLimiter, async (req, res) => {
    const parsed = login.safeParse(req.body);
    const user = parsed.success ? await users.authenticate(parsed.data.email, parsed.data.password) : null;
    // One generic message: don't tell attackers whether the EMAIL exists
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ accessToken: await tokens.issue(user), tokenType: 'Bearer', expiresIn: 900 });
  });

  const courses = [{ id: 1, title: 'Node.js Security' }];
  app.get('/api/courses', (req, res) => res.json(courses));   // public

  const auth = authenticate(tokens);
  app.get('/api/me', auth, (req, res) => res.json(users.findById(req.user.id)));

  app.post('/api/courses', auth, requireRole('admin'), (req, res) => {
    const course = { id: courses.length + 1, title: String(req.body.title ?? 'Untitled') };
    courses.push(course);
    res.status(201).json(course);
  });

  // OWNERSHIP check: users see only their own orders; admins see anyone's (prevents IDOR attacks)
  app.get('/api/users/:id/orders', auth, (req, res) => {
    const id = Number(req.params.id);
    if (req.user.id !== id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    res.json([{ orderId: 100 + id, userId: id }]);
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status ?? 500).json({ error: err.status ? err.message : 'Internal Server Error' });
  });
  return app;
}
