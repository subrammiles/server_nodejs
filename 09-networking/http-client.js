// Built-in fetch (Node 18+): the same API as in browsers. No axios needed for most cases.
// Run: node 09-networking/http-client.js   (needs internet)
import { lookup } from 'node:dns/promises';

console.log('DNS lookup:', await lookup('example.com'));

const res = await fetch('https://jsonplaceholder.typicode.com/posts/1', { signal: AbortSignal.timeout(5000) });
console.log('status:', res.status, res.headers.get('content-type'));
console.log('json  :', await res.json());

const created = await fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'hello', body: 'from Node', userId: 1 }),
});
console.log('POST  :', created.status, await created.json());
// Lesson 18 adds timeouts, retries and error handling around fetch.
