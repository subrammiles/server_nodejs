import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { decrypt, encrypt, hashPassword, newId, newToken, sha256, sign, verifyPassword, verifySignature } from './crypto-utils.js';

describe('crypto utilities', () => {
  it('sha256 is deterministic', () => {
    assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('HMAC verification detects tampering and wrong secrets', () => {
    const sig = sign('payload', 'k');
    assert.equal(verifySignature('payload', sig, 'k'), true);
    assert.equal(verifySignature('payload!', sig, 'k'), false);
    assert.equal(verifySignature('payload', sig, 'other'), false);
    assert.equal(verifySignature('payload', 'abcd', 'k'), false);
  });

  it('password hashes are salted and verifiable', async () => {
    const a = await hashPassword('pw');
    const b = await hashPassword('pw');
    assert.notEqual(a, b);   // same password, different salt
    assert.equal(await verifyPassword('pw', a), true);
    assert.equal(await verifyPassword('PW', a), false);
  });

  it('AES-GCM round trip, and tampering is detected', () => {
    const key = randomBytes(32);
    const token = encrypt('secret', key);
    assert.equal(decrypt(token, key), 'secret');
    assert.notEqual(encrypt('secret', key), token);   // random IV each time

    const [iv, tag, data] = token.split('.');
    const flipped = Buffer.from(data, 'base64');
    flipped[0] ^= 1;
    assert.throws(() => decrypt([iv, tag, flipped.toString('base64')].join('.'), key));
    assert.throws(() => decrypt(token, randomBytes(32)));
  });

  it('random ids and tokens', () => {
    assert.match(newId(), /^[0-9a-f-]{36}$/);
    assert.equal(newToken(32).length, 43);
  });
});
