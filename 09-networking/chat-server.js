// A TCP chat room (raw sockets, no HTTP). Ported from the old net-module examples.
// Run: node 09-networking/chat-server.js   then in 2+ terminals: nc localhost 4000
import net from 'node:net';

export function createChatServer() {
  const clients = new Set();

  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    socket.name = `${socket.remoteAddress}:${socket.remotePort}`;
    clients.add(socket);
    socket.write('Welcome! Type a message and press Enter.\n');
    broadcast(`* ${socket.name} joined\n`, socket);

    let buffered = '';
    socket.on('data', (data) => {
      // TCP is a byte STREAM, not messages: one write may arrive split or merged. Frame by newline.
      buffered += data;
      let newline;
      while ((newline = buffered.indexOf('\n')) !== -1) {
        const line = buffered.slice(0, newline).trim();
        buffered = buffered.slice(newline + 1);
        if (line) broadcast(`${socket.name}: ${line}\n`, socket);
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
      broadcast(`* ${socket.name} left\n`, socket);
    });
    socket.on('error', () => clients.delete(socket));   // e.g. client vanished: never crash the server
    socket.setTimeout(5 * 60_000, () => socket.end('Idle timeout, bye.\n'));
  });

  function broadcast(message, sender) {
    for (const client of clients) {
      if (client !== sender) client.write(message);
    }
  }

  return server;
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  createChatServer().listen(4000, () => console.log('chat on tcp://localhost:4000 (connect with: nc localhost 4000)'));
}
