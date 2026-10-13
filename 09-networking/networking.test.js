import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import dgram from 'node:dgram';
import { once } from 'node:events';
import { createChatServer } from './chat-server.js';
import { createEchoServer } from './udp-echo.js';

function connect(port) {
  const socket = net.connect(port, 'localhost');
  socket.setEncoding('utf8');
  socket.received = '';
  socket.on('data', (d) => { socket.received += d; });
  return once(socket, 'connect').then(() => socket);
}

async function waitFor(predicate, timeoutMs = 2000) {
  const end = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > end) throw new Error('condition not met in time');
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe('TCP chat', () => {
  it('broadcasts messages to everyone except the sender, even when split across packets', async () => {
    const server = createChatServer().listen(0);
    await once(server, 'listening');
    const { port } = server.address();
    const alice = await connect(port);
    const bob = await connect(port);
    try {
      await waitFor(() => alice.received.includes('joined'));
      bob.write('Hel');           // one message, sent in two pieces
      bob.write('lo all\n');
      await waitFor(() => alice.received.includes('Hello all'));
      assert.doesNotMatch(bob.received, /: Hello all/);
    } finally {
      alice.destroy();
      bob.destroy();
      server.close();
    }
  });
});

describe('UDP echo', () => {
  it('echoes a datagram', async () => {
    const server = createEchoServer();
    server.bind(0);
    await once(server, 'listening');
    const client = dgram.createSocket('udp4');
    try {
      client.send('ping', server.address().port, '127.0.0.1');
      const [msg] = await once(client, 'message');
      assert.equal(msg.toString(), 'echo: ping');
    } finally {
      client.close();
      server.close();
    }
  });
});
