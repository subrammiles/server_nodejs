// AUTHENTICATION middleware: who is calling? (401 if we don't know)
export function authenticate(tokens) {
  return async (req, res, next) => {
    const [scheme, token] = (req.get('authorization') ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).set('WWW-Authenticate', 'Bearer').json({ error: 'Authentication required' });
    }
    try {
      const claims = await tokens.verify(token);
      req.user = { id: Number(claims.sub), role: claims.role, name: claims.name };
      next();
    } catch {
      res.status(401).set('WWW-Authenticate', 'Bearer error="invalid_token"').json({ error: 'Invalid or expired token' });
    }
  };
}

// AUTHORIZATION middleware: may this caller do this? (403 if not)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
