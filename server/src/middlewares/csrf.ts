import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import { config } from '../config';
import { COOKIE_NAMES } from '../utils/cookies';
import { forbidden } from '../utils/app-error';
import { verifyAccessToken } from '../services/token.service';

export const CSRF_HEADER = 'x-csrf-token';
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ANON = 'anon';

// Separate key from the JWT signing key (domain separation).
const csrfKey = createHmac('sha256', config.jwtSecret).update('csrf-v1').digest();

const sign = (nonce: string, binding: string): string =>
  createHmac('sha256', csrfKey).update(`${nonce}.${binding}`).digest('hex');

/** Session binding: the family id inside the (possibly expired) access JWT; "anon" when absent. */
export function csrfBinding(req: Request): string {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const access = cookies?.[COOKIE_NAMES.access];
  const claims = access ? verifyAccessToken(access, { ignoreExpiration: true }) : null;
  return claims ? claims.fid : ANON;
}

export function issueCsrfToken(binding: string): string {
  const nonce = randomBytes(16).toString('hex');
  return `${nonce}.${sign(nonce, binding)}`;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function validToken(token: string, binding: string): boolean {
  const [nonce, sig, ...rest] = token.split('.');
  if (!nonce || !sig || rest.length > 0) return false;
  return safeEqual(sig, sign(nonce, binding));
}

function requestOrigin(req: Request): string | null {
  const origin = req.get('origin');
  if (origin) return origin;
  const referer = req.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/** Applies to EVERY unsafe method (including login/register/refresh/logout). */
export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (!UNSAFE.has(req.method)) return next();
  if (requestOrigin(req) !== config.clientOrigin) return next(forbidden('Invalid request origin'));
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const cookieToken = cookies?.[COOKIE_NAMES.csrf];
  const headerToken = req.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken) || !validToken(headerToken, csrfBinding(req))) {
    return next(forbidden('Invalid CSRF token'));
  }
  next();
};
