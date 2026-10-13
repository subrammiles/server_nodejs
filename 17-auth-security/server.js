// Run: JWT_SECRET=$(openssl rand -base64 48) node 17-auth-security/server.js
import { randomBytes } from 'node:crypto';
import { createApp } from './src/app.js';
import { TokenService } from './src/tokens.js';
import { UserStore } from './src/users.js';

let secret = process.env.JWT_SECRET;
if (!secret) {
  // Random per start: fine for a demo, but every restart logs everyone out. Set JWT_SECRET for real use.
  secret = randomBytes(48).toString('base64');
  console.warn('JWT_SECRET not set: using a random secret for this run');
}

const users = new UserStore();
await users.register({ email: 'admin@example.com', password: 'admin-password-123', name: 'Admin', role: 'admin' });

const port = Number(process.env.PORT ?? 3000);
createApp({ users, tokens: new TokenService({ secret }) })
  .listen(port, () => console.log(`http://localhost:${port} (demo admin: admin@example.com / admin-password-123)`));
