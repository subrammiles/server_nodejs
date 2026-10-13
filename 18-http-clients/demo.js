// Run: node 18-http-clients/demo.js   (needs internet)
import { mapLimit } from '../02-async/promises.js';
import { HttpError, createHttpClient } from './http-client.js';

const api = createHttpClient({ baseUrl: 'https://jsonplaceholder.typicode.com', timeoutMs: 5000 });

const post = await api.get('/posts/1');
console.log('GET  /posts/1  ->', post.title);

const created = await api.post('/posts', { title: 'Hello', body: 'from Node', userId: 1 });
console.log('POST /posts    ->', created);

// Many calls, but at most 3 in flight: be polite to other people's servers
const users = await mapLimit([1, 2, 3, 4, 5, 6], 3, (id) => api.get(`/users/${id}`));
console.log('6 users (max 3 concurrent) ->', users.map((u) => u.name).join(', '));

try {
  await api.get('/posts/999999');
} catch (e) {
  if (e instanceof HttpError) console.log('GET missing    ->', e.message, '(not retried: 4xx)');
}
