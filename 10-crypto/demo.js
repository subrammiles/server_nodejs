// Run: node 10-crypto/demo.js
import { randomBytes } from 'node:crypto';
import { decrypt, encrypt, hashPassword, newId, newToken, sha256, sign, verifyPassword, verifySignature } from './crypto-utils.js';

console.log('sha256("hello")   ', sha256('hello'));
const signature = sign('{"event":"paid"}', 'webhook-secret');
console.log('HMAC signature    ', signature);
console.log('signature valid?  ', verifySignature('{"event":"paid"}', signature, 'webhook-secret'));
console.log('tampered valid?   ', verifySignature('{"event":"refund"}', signature, 'webhook-secret'));

const stored = await hashPassword('s3cret!');
console.log('password hash     ', stored.slice(0, 60) + '...');
console.log('right password?   ', await verifyPassword('s3cret!', stored));
console.log('wrong password?   ', await verifyPassword('guess', stored));

const key = randomBytes(32);   // in real apps: from a secret manager / env var, never in code
const token = encrypt('card ending 4242', key);
console.log('encrypted         ', token);
console.log('decrypted         ', decrypt(token, key));
console.log('uuid / token      ', newId(), newToken());
