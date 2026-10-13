// JSON Web Tokens with `jose`. A JWT = base64url(header).base64url(payload).signature
// Anyone can READ the payload; only the holder of the secret can CREATE a valid signature.
import { SignJWT, jwtVerify } from 'jose';

export class TokenService {
  constructor({ secret, issuer = 'node-tutorial', ttl = '15m' }) {
    if (!secret || secret.length < 32) throw new Error('JWT secret must be at least 32 characters');
    this.key = new TextEncoder().encode(secret);
    this.issuer = issuer;
    this.ttl = ttl;
  }

  issue(user, { ttl = this.ttl } = {}) {
    return new SignJWT({ role: user.role, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(user.id))
      .setIssuer(this.issuer)
      .setIssuedAt()
      .setExpirationTime(ttl)   // short-lived: a stolen token is useful only briefly
      .sign(this.key);
  }

  async verify(token) {
    const { payload } = await jwtVerify(token, this.key, { issuer: this.issuer, algorithms: ['HS256'] });
    return payload;   // throws on bad signature, wrong issuer, expiry, or a different algorithm
  }
}
