// MIDDLEWARE: functions (req, res, next) that run in order for each request.
// Each one can read/modify req and res, end the response, or call next() to continue.

export function requestLogger(req, res, next) {
  const start = performance.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${(performance.now() - start).toFixed(1)}ms`);
    }
  });
  next();   // forget this and the request hangs forever
}

export function requestTime(req, res, next) {
  req.requestTime = new Date().toISOString();   // attach data for later middleware/handlers
  next();
}

// Middleware factory: a function that RETURNS middleware, so it can be configured
export function requireApiKey(expectedKey) {
  return (req, res, next) => {
    if (req.get('x-api-key') !== expectedKey) {
      return res.status(401).json({ error: 'Missing or invalid API key' });   // end the chain here
    }
    next();
  };
}
