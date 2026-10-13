# 19: Realtime with WebSockets

HTTP is request/response: the server can only answer. A **WebSocket** is a long-lived, **two-way** connection
(started as an HTTP "Upgrade"), so the server can **push** data: chat, notifications, live dashboards, multiplayer games.

## Concepts
- `ws` attached to an existing HTTP server (`new WebSocketServer({ server, path: '/chat' })`). One port serves both the page and the socket.
- Connection lifecycle: `connection`, then `message`, then `close`. Per-connection state lives on the socket object (name, room).
- **Broadcasting** and **rooms**: send to every open client in the same room. **Presence**: who's online.
- **Validate everything** clients send (JSON, required fields, `maxPayload`). Never trust the browser.
- **Heartbeats** (`ping`/`pong`): detect and drop dead connections that never sent a close.
- **Scaling out**: each server instance knows only its own sockets. With several instances, share messages through
  Redis pub/sub or a broker. Socket.IO (from the old repo) adds rooms, reconnection and fallbacks out of the box.
- Alternatives: **Server-Sent Events** (one-way server-to-client over plain HTTP, simpler) and long polling.
- Auth: check a token (lesson 17) during the upgrade, e.g. in the query string or a cookie.

## Run
```bash
node 19-websockets/chat-server.js          # open http://localhost:3000 in two tabs
node 19-websockets/client.js Subbu          # a terminal client
node --test "19-websockets/*.test.js"
```
