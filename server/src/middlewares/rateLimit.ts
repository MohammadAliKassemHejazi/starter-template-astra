import type { Request, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { audit } from '../utils/logger';
import { sendError } from '../utils/respond';

export interface RateLimitOptions {
  generalMax: number;
  authMax: number;
  loginMax: number;
  windowMs: number;
}

/** Normalises the email used as a limiter key (same rules as the citext lookup: trim + lowercase). */
export function emailKey(req: Request): string {
  const body = req.body as { email?: unknown } | undefined;
  return typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
}

/** IPv6 clients rotate freely inside a /64, so key on the /64 prefix; IPv4 (and mapped IPv4) as is. */
export function ipKey(ip: string | undefined): string {
  if (!ip) return 'unknown';
  const v4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (v4?.[1]) return v4[1];
  if (!ip.includes(':')) return ip;
  const [head = '', tail = ''] = ip.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = Math.max(0, 8 - headParts.length - tailParts.length);
  const full = ip.includes('::') ? [...headParts, ...Array<string>(missing).fill('0'), ...tailParts] : headParts;
  return `${full.slice(0, 4).map((g) => g.toLowerCase().padStart(4, '0')).join(':')}::/64`;
}

// In-memory store: per process. Multi-instance deployments must swap in a shared store (Redis); see README.
const common = { standardHeaders: 'draft-7', legacyHeaders: false } as const;

function limiter(max: number, windowMs: number, name: string): RequestHandler {
  return rateLimit({
    ...common,
    windowMs,
    limit: max,
    keyGenerator: (req) => ipKey(req.ip),
    handler: (req, res) => {
      audit('rate_limited', { limiter: name, ip: req.ip });
      sendError(res, 429, 'Too many requests, please try again later');
    },
  });
}

export function createLimiters(o: RateLimitOptions = config.rateLimit): {
  general: RequestHandler;
  auth: RequestHandler;
  login: RequestHandler;
} {
  return {
    general: limiter(o.generalMax, o.windowMs, 'general'),
    // /api/auth/* per IP. Runs BEFORE any password hashing.
    auth: limiter(o.authMax, o.windowMs, 'auth'),
    // login: per IP + normalised email; only failed attempts count.
    login: rateLimit({
      ...common,
      windowMs: o.windowMs,
      limit: o.loginMax,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => `${ipKey(req.ip)}|${emailKey(req)}`,
      handler: (req, res) => {
        audit('rate_limited', { limiter: 'login', ip: req.ip });
        sendError(res, 429, 'Too many login attempts, please try again later');
      },
    }),
  };
}
