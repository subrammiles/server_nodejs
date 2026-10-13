// STRUCTURED LOGGING with pino: one JSON object per line. Log platforms (ELK, Loki, Datadog, CloudWatch)
// can search and graph fields like level, reqId, statusCode, responseTime. console.log can't do that well.
import pino from 'pino';

export function createLogger({ level = 'info', destination } = {}) {
  return pino({
    level,
    base: { service: 'production-demo' },
    // NEVER log secrets: these paths are replaced with "[Redacted]"
    redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
  }, destination);
}
