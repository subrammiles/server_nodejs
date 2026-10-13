// An HTTP API with NO framework: shows what Express (lesson 13) does for you.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pipeline } from 'node:stream/promises';

const PUBLIC_DIR = join(import.meta.dirname, 'public');
const MAX_BODY_BYTES = 10_000;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

// The request body arrives as a STREAM of chunks; collect it, but refuse huge bodies
async function readJsonBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Body too large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Malformed JSON');
  }
}

async function serveStatic(req, res, urlPath) {
  const filePath = normalize(join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath));
  if (!filePath.startsWith(PUBLIC_DIR)) throw new HttpError(403, 'Forbidden');   // path traversal guard
  try {
    const info = await stat(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream', 'Content-Length': info.size });
    await pipeline(createReadStream(filePath), res);   // stream: no full file in memory
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EISDIR') throw new HttpError(404, 'Not found');
    throw e;
  }
}

export function createBookServer() {
  const books = new Map([[1, { id: 1, title: 'Node.js Design Patterns' }]]);
  let nextId = 2;

  // ROUTING by hand: method + path
  async function route(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const match = url.pathname.match(/^\/api\/books(?:\/(\d+))?$/);

    if (!match) {
      if (req.method !== 'GET') throw new HttpError(404, 'Not found');
      return serveStatic(req, res, url.pathname);
    }

    const id = match[1] ? Number(match[1]) : null;
    if (id === null && req.method === 'GET') {
      const q = url.searchParams.get('q')?.toLowerCase();   // query string: /api/books?q=node
      return sendJson(res, 200, [...books.values()].filter((b) => !q || b.title.toLowerCase().includes(q)));
    }
    if (id === null && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (typeof body.title !== 'string' || !body.title.trim()) throw new HttpError(400, 'title is required');
      const book = { id: nextId++, title: body.title.trim() };
      books.set(book.id, book);
      return sendJson(res, 201, book, { Location: `/api/books/${book.id}` });
    }
    if (id !== null && req.method === 'GET') {
      if (!books.has(id)) throw new HttpError(404, `Book ${id} not found`);
      return sendJson(res, 200, books.get(id));
    }
    if (id !== null && req.method === 'DELETE') {
      if (!books.delete(id)) throw new HttpError(404, `Book ${id} not found`);
      res.writeHead(204);
      return res.end();
    }
    throw new HttpError(405, `${req.method} not allowed here`);
  }

  return createServer(async (req, res) => {
    const start = performance.now();
    res.on('finish', () => console.log(`${req.method} ${req.url} -> ${res.statusCode} (${(performance.now() - start).toFixed(1)} ms)`));
    try {
      await route(req, res);
    } catch (error) {
      // ONE place that turns errors into responses; unknown errors become 500 without leaking details
      const status = error instanceof HttpError ? error.status : 500;
      if (status === 500) console.error(error);
      if (!res.headersSent) sendJson(res, status, { error: status === 500 ? 'Internal Server Error' : error.message });
      else res.destroy();
    }
  });
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  const server = createBookServer().listen(Number(process.env.PORT ?? 3000), () =>
    console.log(`http://localhost:${server.address().port}`));
}
