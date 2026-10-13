// Domain errors carry an HTTP status. The error handler turns them into RFC 9457 "problem+json".
export class AppError extends Error {
  constructor(status, title, detail, extra = {}) {
    super(detail);
    this.status = status;
    this.title = title;
    this.extra = extra;
  }
}

export class NotFoundError extends AppError {
  constructor(detail) { super(404, 'Not Found', detail); }
}

export class ConflictError extends AppError {
  constructor(detail) { super(409, 'Conflict', detail); }
}

export class ValidationError extends AppError {
  constructor(errors) { super(400, 'Validation failed', 'The request has invalid fields', { errors }); }
}

export function notFoundHandler(req, res) {
  sendProblem(res, req, new NotFoundError(`No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return sendProblem(res, req, new AppError(400, 'Bad Request', 'Malformed JSON body'));
  }
  if (err instanceof AppError) return sendProblem(res, req, err);
  req.log?.error(err) ?? console.error(err);   // unexpected: log everything, reveal nothing
  sendProblem(res, req, new AppError(500, 'Internal Server Error', 'Something went wrong'));
}

function sendProblem(res, req, err) {
  res.status(err.status).type('application/problem+json').json({
    type: 'about:blank',
    title: err.title,
    status: err.status,
    detail: err.message,
    instance: req.originalUrl,
    ...err.extra,
  });
}
