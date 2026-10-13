import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import WebSocket from 'ws';
import { createChatServer } from './chat-server.js';

describe('WebSocket chat', () => {
  let server;
  let base;

  before(async () => {
    ({ server } = createChatServer({ heartbeatMs: 50 }));
    server.listen(0);
    await once(server, 'listening');
    base = `ws://localhost:${server.address().port}/chat`;
  });
  after(() => server.close());

  // Connect and collect every message the client receives
  async function join(name, room = 'lobby') {
    const ws = new WebSocket(`${base}?name=${name}&room=${room}`);
    ws.inbox = [];
    ws.on('message', (d) => ws.inbox.push(JSON.parse(d)));
    await once(ws, 'open');
    return ws;
  }

  async function until(predicate) {
    for (let i = 0; i < 100 && !predicate(); i++) await new Promise((r) => setTimeout(r, 10));
    assert.ok(predicate(), 'condition not met in time');
  }

  it('broadcasts to everyone in the room, with presence', async () => {
    const asha = await join('asha');
    const ravi = await join('ravi');
    await until(() => asha.inbox.some((m) => m.type === 'join' && m.user === 'ravi'));
    assert.deepEqual(asha.inbox.at(-1).online, ['asha', 'ravi']);

    ravi.send(JSON.stringify({ text: '  hello  ' }));
    await until(() => asha.inbox.some((m) => m.type === 'message'));
    assert.equal(asha.inbox.find((m) => m.type === 'message').text, 'hello');

    ravi.close();
    await until(() => asha.inbox.some((m) => m.type === 'leave' && m.user === 'ravi'));
    asha.close();
  });

  it('rooms are isolated', async () => {
    const a = await join('a', 'red');
    const b = await join('b', 'blue');
    a.send(JSON.stringify({ text: 'only red' }));
    await until(() => a.inbox.some((m) => m.type === 'message'));
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(b.inbox.some((m) => m.type === 'message'), false);
    a.close();
    b.close();
  });

  it('rejects malformed messages without dropping the connection', async () => {
    const c = await join('c');
    c.send('not json');
    c.send(JSON.stringify({ text: '' }));
    await until(() => c.inbox.filter((m) => m.type === 'error').length === 2);
    assert.equal(c.readyState, WebSocket.OPEN);
    c.close();
  });

  it('heartbeat terminates clients that stop answering pings', async () => {
    // autoPong: false = this client never answers pings, like a vanished laptop
    const zombie = new WebSocket(`${base}?name=zombie`, { autoPong: false });
    await once(zombie, 'open');
    const peer = await join('peer');
    await until(() => peer.inbox.some((m) => m.type === 'leave' && m.user === 'zombie'));
    peer.close();
    zombie.terminate();
  });
});
