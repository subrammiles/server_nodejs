import express from 'express';
import { setTimeout as sleep } from 'node:timers/promises';
import { join } from 'node:path';
import { requestLogger, requestTime, requireApiKey } from './middleware.js';
import { usersRouter } from './routes/users.js';
import { paymentsRouter } from './routes/payments.js';

// Export a FUNCTION that builds the app (without listening): tests import it, server.js starts it.
export function createApp() {
  const app = express();

  // 1. Application-level middleware: runs for EVERY request, in this order
  app.use(requestLogger);
  app.use(requestTime);
  app.use(express.json({ limit: '100kb' }));            // parses JSON bodies into req.body
  app.use(express.urlencoded({ extended: false }));     // parses HTML form posts
  app.use('/static', express.static(join(import.meta.dirname, 'public')));   // files: /static/hello.txt

  // 2. Routes: app.METHOD(path, ...handlers)
  app.get('/', (req, res) => res.send(`Hello from Express (requested at ${req.requestTime})`));

  // Query string: /search?q=node&limit=5 -> req.query (strings!)
  app.get('/search', (req, res) => {
    const { q = '', limit = '10' } = req.query;
    res.json({ q, limit: Number(limit) });
  });

  // Several params, and the 4 ways to send data back
  app.get('/greet/:lang/:name', (req, res) => {
    const greetings = { en: 'Hello', te: 'Namaskaram', fr: 'Bonjour' };
    const word = greetings[req.params.lang];
    if (!word) return res.status(400).json({ error: 'unsupported language' });
    res.type('text').send(`${word}, ${req.params.name}!`);
  });

  // Express 5 path syntax: named wildcard and optional segment
  app.get('/files/*filePath', (req, res) => res.json({ path: req.params.filePath.join('/') }));
  app.get('/archive{/:year}', (req, res) => res.json({ year: req.params.year ?? 'all' }));

  // Headers in, headers out
  app.get('/whoami', (req, res) => {
    res.set('Cache-Control', 'no-store').json({ userAgent: req.get('user-agent'), ip: req.ip });
  });

  app.get('/old-docs', (req, res) => res.redirect(301, '/static/hello.txt'));

  // Routers mounted at a prefix
  app.use('/users', usersRouter);
  app.use('/payments', requireApiKey('secret-key'), paymentsRouter);   // middleware only for this mount

  // ASYNC handlers: in Express 5 a rejected promise goes to the error handler automatically
  // (Express 4 needed try/catch + next(err) in every async handler)
  app.get('/async-ok', async (req, res) => {
    await sleep(10);
    res.json({ ok: true });
  });
  app.get('/async-fail', async () => {
    await sleep(10);
    throw new Error('database unavailable');
  });

  // PITFALL from the old repo: responding twice throws ERR_HTTP_HEADERS_SENT
  app.get('/send-twice', (req, res) => {
    res.send('first');
    try {
      res.send('second');
    } catch (e) {
      console.error('second send failed:', e.code);
    }
  });

  // 3. 404: no route matched (must come AFTER all routes)
  app.use((req, res) => res.status(404).json({ error: `Cannot ${req.method} ${req.path}` }));

  // 4. Error handler: recognised by its FOUR parameters; must be registered last
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' });
    if (process.env.NODE_ENV !== 'test') console.error(err);
    res.status(err.status ?? 500).json({ error: err.status ? err.message : 'Internal Server Error' });
  });

  return app;
}
