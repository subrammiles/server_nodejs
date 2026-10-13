# 09: Networking (TCP, UDP, DNS, fetch)

HTTP is built on TCP. This lesson goes one level lower.

| | TCP (`node:net`) | UDP (`node:dgram`) |
|---|---|---|
| Connection | yes (handshake) | no |
| Delivery | reliable, ordered **byte stream** | datagrams, may be lost or reordered |
| Used by | HTTP, databases, SSH, chat | DNS, metrics, games, video calls |

## Concepts
- **TCP chat server** (`chat-server.js`): each connection is a socket (a Duplex stream). Keep a set of clients and broadcast.
- **Framing**: TCP has no message boundaries. One `write` can arrive in pieces or merged with the next, so split on
  a delimiter (`\n`) or use length prefixes. The test sends one message in two writes to prove it.
- **Handle `'error'` and `'close'`** on every socket. A disconnecting client must never crash the server.
- **Timeouts** (`socket.setTimeout`) to drop idle connections.
- **UDP echo** (`udp-echo.js`).
- **DNS** (`node:dns/promises`) and the built-in **`fetch`** client (`http-client.js`).
- TLS/HTTPS: `node:tls` and `node:https` wrap the same APIs with encryption. In production TLS usually terminates at a
  load balancer or reverse proxy in front of Node.
- WebSockets (lesson 19) give browsers a two-way connection like this chat.

## Run
```bash
node 09-networking/chat-server.js          # then in two terminals: nc localhost 4000
node 09-networking/udp-echo.js             # then: echo -n hi | nc -u -w1 localhost 4001
node 09-networking/http-client.js          # needs internet
node --test "09-networking/*.test.js"
```
