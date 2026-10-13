# 10: Cryptography for backend developers

**Never invent your own crypto.** Learn which built-in primitive fits which job:

| Job | Use | Not |
|---|---|---|
| fingerprint / checksum / cache key | `sha256` | `md5`, `sha1` (broken) |
| prove a message came from someone with the key (webhooks) | **HMAC** + `timingSafeEqual` | plain hash, `===` comparison |
| store passwords | **scrypt** (or bcrypt/argon2): slow and salted | sha256, encryption, plain text |
| keep data secret but recoverable | **AES-256-GCM** (authenticated) | AES-ECB/CBC without a MAC |
| ids, tokens, reset links | `randomUUID()`, `randomBytes()` | `Math.random()` |

## Concepts
- **Hashing vs encryption**: a hash is one-way, encryption is reversible with a key.
- **Salt**: random per password, so equal passwords hash differently and precomputed tables don't work.
- **Slow on purpose**: password KDFs cost milliseconds per guess, which makes brute force expensive.
- **Timing attacks**: comparing secrets with `===` stops at the first difference. Use `timingSafeEqual`.
- **IV/nonce**: random for every encryption, never reused with the same key. GCM's auth tag detects tampering.
- **Key management** matters more than the algorithm: keys come from a secret manager or env vars, never from code or git.
- JWTs (signed tokens) build on HMAC/RSA. See lesson 17. TLS/HTTPS encrypts traffic in transit.

## Run
```bash
node 10-crypto/demo.js
node --test "10-crypto/*.test.js"
```
