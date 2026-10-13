// Realtime chat with WebSockets (the `ws` package): one long-lived, TWO-WAY connection per client,
// so the server can push messages at any time. HTTP is request/response only.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { WebSocketServer } from 'ws';

export function createChatServer({ heartbeatMs = 30_000 } = {}) {
  // One HTTP server serves the web page AND accepts WebSocket upgrades on /chat
  const server = createServer(async (req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(await readFile(new URL('./public/index.html', import.meta.url)));
    }
    res.writeHead(404).end();
  });

  const wss = new WebSocketServer({ server, path: '/chat', maxPayload: 4096 });

  function broadcast(room, message) {
    const data = JSON.stringify({ ...message, room, at: new Date().toISOString() });
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN && client.room === room) client.send(data);
    }
  }

  wss.on('connection', (socket, req) => {
    const params = new URL(req.url, 'http://localhost').searchParams;
    socket.name = (params.get('name') ?? 'anonymous').slice(0, 30);
    socket.room = params.get('room') ?? 'lobby';
    socket.isAlive = true;

    broadcast(socket.room, { type: 'join', user: socket.name, online: onlineIn(socket.room) });

    socket.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        return socket.send(JSON.stringify({ type: 'error', error: 'Messages must be JSON' }));
      }
      if (typeof message.text !== 'string' || !message.text.trim()) {
        return socket.send(JSON.stringify({ type: 'error', error: 'text is required' }));
      }
      broadcast(socket.room, { type: 'message', from: socket.name, text: message.text.trim().slice(0, 500) });
    });

    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('close', () => broadcast(socket.room, { type: 'leave', user: socket.name, online: onlineIn(socket.room) }));
  });

  function onlineIn(room) {
    return [...wss.clients].filter((c) => c.room === room && c.readyState === c.OPEN).map((c) => c.name).sort();
  }

  // HEARTBEAT: detect clients that vanished without closing (laptop lid closed, network lost)
  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      if (!client.isAlive) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, heartbeatMs);
  server.on('close', () => clearInterval(heartbeat));

  return { server, wss };
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  const port = Number(process.env.PORT ?? 3000);
  createChatServer().server.listen(port, () => console.log(`open http://localhost:${port} in two browser tabs`));
}
