# 17: Authentication and security

## Flow
```
POST /auth/register {email, password, name}   -> 201, password stored as a salted scrypt hash, role "user"
POST /auth/login    {email, password}         -> {accessToken: "eyJ..."} (JWT, valid 15 min)
GET  /api/me        Authorization: Bearer eyJ...
```

## Concepts
- **Authentication** (who are you? failure is **401**) vs **authorization** (may you? failure is **403**).
- **Password storage**: a salted, slow hash (`scrypt`, lesson 10). Never plain text, never sha256. Never return the hash.
- **JWT** with `jose`: a signed, short-lived token carrying `sub`, `role`, `exp`. The payload is readable by anyone,
  so put no secrets in it. Verify the signature, issuer, expiry and **algorithm**.
  The secret comes from `JWT_SECRET` and must be long. Weak secrets are refused at startup.
- **Middleware**: `authenticate` sets `req.user`, then `requireRole('admin')`, plus ownership checks
  (users only see their own orders, which prevents **IDOR**, insecure direct object references).
- **Mass assignment**: `.strict()` validation stops `{"role":"admin"}` in a registration body.
- **No user enumeration**: the same error and similar timing for "unknown email" and "wrong password".
- **Rate limiting** login (`express-rate-limit`, 429). Use a shared store (Redis) when running several instances.
- **helmet**: security headers (CSP, `nosniff`, no `X-Powered-By`...).
- **CORS**: an allowlist of browser origins. CORS protects browsers' users and is not authentication.
- Also know: HTTPS everywhere, refresh tokens and logout/revocation, cookies (`HttpOnly`, `Secure`, `SameSite`)
  and CSRF for cookie sessions, OAuth2/OIDC login ("Sign in with Google") via an identity provider,
  dependency auditing (`npm audit`), and the OWASP Top 10.

## Run
```bash
JWT_SECRET=$(openssl rand -base64 48) node 17-auth-security/server.js
TOKEN=$(curl -s -X POST localhost:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin-password-123"}' | node -p 'JSON.parse(require("fs").readFileSync(0)).accessToken')
curl -H "Authorization: Bearer $TOKEN" localhost:3000/api/me
node --test "17-auth-security/test/*.test.js"
```
