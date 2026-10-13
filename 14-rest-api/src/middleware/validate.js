import { ValidationError } from '../errors.js';

// validate({ body, query, params }) -> middleware. Parsed, typed, defaulted values end up in req.valid.
// (In Express 5 req.query is read-only, so we don't overwrite it.)
export function validate(schemas) {
  return (req, res, next) => {
    const valid = {};
    const errors = [];
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          errors.push({ in: part, field: issue.path.join('.') || '(root)', message: issue.message });
        }
      }
    }
    if (errors.length) throw new ValidationError(errors);
    req.valid = valid;
    next();
  };
}
