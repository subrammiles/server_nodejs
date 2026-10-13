import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { decodeJwt } from 'jose';
import { createApp } from '../src/app.js';
import { TokenService } from '../src/tokens.js';
import { UserStore } from '../src/users.js';

const SECRET = 'test-secret-that-is-long-enough-1234567890';

describe('authentication and authorization', () => {
  let app;
  let users;
  let tokens;

  beforeEach(async () => {
    users = new UserStore();
    tokens = new TokenService({ secret: SECRET });
    await users.register({ email: 'admin@example.com', password: 'admin-password-123', name: 'Admin', role: 'admin' });
    app = createApp({ users, tokens, loginLimit: 3 });
  });

  async function loginAs(email, password) {
    const res = await request(app).post('/auth/login').send({ email, password }).expect(200);
    return res.body.accessToken;
  }

  it('register -> login -> call a protected endpoint', async () => {
    const created = await request(app).post('/auth/register')
      .send({ email: 'Meera@Example.com', password: 'correct-horse-battery', name: 'Meera' }).expect(201);
    assert.equal(created.body.role, 'user');
    assert.equal(created.body.passwordHash, undefined);   // never leaked

    const token = await loginAs('meera@example.com', 'correct-horse-battery');
    assert.equal(decodeJwt(token).role, 'user');           // readable by anyone; no secrets inside
    const me = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`).expect(200);
    assert.equal(me.body.email, 'meera@example.com');
  });

  it('stores a salted hash, never the password', async () => {
    const raw = users.rawByEmail('admin@example.com');
    assert.match(raw.passwordHash, /^scrypt\$/);
    assert.doesNotMatch(raw.passwordHash, /admin-password/);
  });

  it('a client cannot register itself as admin, and weak input is rejected', async () => {
    await request(app).post('/auth/register').send({ email: 'x@example.com', password: 'long-enough-pw', name: 'X', role: 'admin' }).expect(400);
    await request(app).post('/auth/register').send({ email: 'not-an-email', password: 'short', name: '' }).expect(400);
    await request(app).post('/auth/register').send({ email: 'admin@example.com', password: 'whatever-123', name: 'Dup' }).expect(409);
  });

  it('same answer for unknown email and wrong password (no user enumeration)', async () => {
    const a = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'x' }).expect(401);
    const b = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'wrong' }).expect(401);
    assert.deepEqual(a.body, b.body);
  });

  it('401 without a token or with a tampered / expired / foreign token', async () => {
    await request(app).get('/api/me').expect(401).expect('WWW-Authenticate', 'Bearer');

    const token = await loginAs('admin@example.com', 'admin-password-123');
    const [header, payload, signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ ...decodeJwt(token), sub: '999' })).toString('base64url');
    await request(app).get('/api/me').set('Authorization', `Bearer ${header}.${forgedPayload}.${signature}`).expect(401);

    const expired = await tokens.issue({ id: 1, role: 'admin', name: 'A' }, { ttl: '-1s' });
    await request(app).get('/api/me').set('Authorization', `Bearer ${expired}`).expect(401);

    const otherKey = await new TokenService({ secret: 'a-completely-different-secret-0123456789' }).issue({ id: 1, role: 'admin' });
    await request(app).get('/api/me').set('Authorization', `Bearer ${otherKey}`).expect(401);
  });

  it('roles: 403 for users on admin endpoints, 201 for admins', async () => {
    await users.register({ email: 'u@example.com', password: 'user-password-1', name: 'U' });
    const userToken = await loginAs('u@example.com', 'user-password-1');
    const adminToken = await loginAs('admin@example.com', 'admin-password-123');

    await request(app).get('/api/courses').expect(200);   // public
    await request(app).post('/api/courses').set('Authorization', `Bearer ${userToken}`).send({ title: 'x' }).expect(403);
    await request(app).post('/api/courses').set('Authorization', `Bearer ${adminToken}`).send({ title: 'x' }).expect(201);
  });

  it('ownership: users see only their own orders (IDOR protection)', async () => {
    const user = await users.register({ email: 'o@example.com', password: 'owner-password-1', name: 'O' });
    const token = await loginAs('o@example.com', 'owner-password-1');
    await request(app).get(`/api/users/${user.id}/orders`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).get('/api/users/1/orders').set('Authorization', `Bearer ${token}`).expect(403);
  });

  it('rate limiting stops brute-force login attempts', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app).post('/auth/login').send({ email: 'admin@example.com', password: `guess-${i}` }).expect(401);
    }
    const blocked = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'admin-password-123' }).expect(429);
    assert.ok(blocked.headers.ratelimit);
  });

  it('security headers (helmet) and CORS allowlist', async () => {
    const res = await request(app).get('/api/courses').set('Origin', 'http://localhost:5173');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['content-security-policy']);
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');

    const evil = await request(app).get('/api/courses').set('Origin', 'https://evil.example');
    assert.equal(evil.headers['access-control-allow-origin'], undefined);
  });

  it('refuses weak JWT secrets at startup', () => {
    assert.throws(() => new TokenService({ secret: 'short' }), /at least 32/);
  });
});
