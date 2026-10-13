// Everyday cryptography with node:crypto. Rule #1: never invent your own crypto, use these primitives.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

// HASH: fixed-size fingerprint of data (checksums, cache keys, deduplication). One-way.
export function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

// HMAC: hash + secret key, which proves the sender knew the key (webhook signatures, signed cookies)
export function sign(message, secret) {
  return createHmac('sha256', secret).update(message).digest('hex');
}

export function verifySignature(message, signature, secret) {
  const expected = Buffer.from(sign(message, secret), 'hex');
  const given = Buffer.from(signature, 'hex');
  // Constant-time comparison: "===" leaks timing information an attacker can measure
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// PASSWORDS: never store them, and never with a fast hash like sha256. Use a SLOW, salted KDF
// (scrypt is built in; bcrypt and argon2 are popular npm alternatives).
export async function hashPassword(password) {
  const salt = randomBytes(16);   // unique per user: identical passwords get different hashes
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [, saltHex, keyHex] = stored.split('$');
  const key = await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64);
  return timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
}

// ENCRYPTION: reversible with the key. AES-256-GCM also detects tampering (authenticated encryption).
export function encrypt(plaintext, key) {
  const iv = randomBytes(12);   // never reuse an IV with the same key
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((b) => b.toString('base64')).join('.');
}

export function decrypt(token, key) {
  const [iv, tag, encrypted] = token.split('.').map((part) => Buffer.from(part, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// RANDOMNESS: cryptographically secure ids and tokens (never Math.random() for security)
export const newId = () => randomUUID();
export const newToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
