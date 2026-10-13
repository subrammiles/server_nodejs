// A Node WebSocket client. Run the server, then: node 19-websockets/client.js Subbu
import WebSocket from 'ws';
import { createInterface } from 'node:readline';

const name = process.argv[2] ?? 'cli-user';
const ws = new WebSocket(`ws://localhost:${process.env.PORT ?? 3000}/chat?name=${encodeURIComponent(name)}`);

ws.on('open', () => console.log('connected. type messages, Ctrl+C to quit'));
ws.on('message', (data) => {
  const m = JSON.parse(data);
  console.log(m.type === 'message' ? `${m.from}: ${m.text}` : `* ${JSON.stringify(m)}`);
});
ws.on('close', () => process.exit(0));

createInterface({ input: process.stdin }).on('line', (text) => ws.send(JSON.stringify({ text })));
