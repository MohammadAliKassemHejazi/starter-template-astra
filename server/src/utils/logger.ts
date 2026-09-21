import { createHmac } from 'node:crypto';
import winston from 'winston';
import { config } from '../config';

const SENSITIVE_KEY = /cookie|authorization|password|token|secret|hash/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY.test(k) ? '[REDACTED]' : redact(v, depth + 1);
  }
  return out;
}

const redactFormat = winston.format((info) => {
  const { level, message, ...meta } = info;
  return Object.assign({ level, message }, redact(meta) as object) as winston.Logform.TransformableInfo;
});

const logKey = createHmac('sha256', config.jwtSecret).update('log-v1').digest();

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(redactFormat(), winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  silent: process.env.NODE_ENV === 'test',
});

/** Strip control characters (log injection) and cap length of client-supplied strings. */
export function sanitizeForLog(value: unknown, max = 255): string {
  // eslint-disable-next-line no-control-regex
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
}

/** Stable, non-reversible reference for an email (failed logins must not log the address itself). */
export function hashForLog(value: string): string {
  return createHmac('sha256', logKey).update(value.trim().toLowerCase()).digest('hex').slice(0, 16);
}

export interface AuditEvent {
  actorId?: string | null;
  targetId?: string | null;
  ip?: string | undefined;
  [key: string]: unknown;
}

/** Security-relevant events; carries actor + target ids, never bodies or credentials. */
export function audit(event: string, data: AuditEvent = {}): void {
  const { ip, ...rest } = data;
  logger.info(event, { audit: true, ...rest, ...(ip ? { ip: sanitizeForLog(ip, 64) } : {}) });
}
