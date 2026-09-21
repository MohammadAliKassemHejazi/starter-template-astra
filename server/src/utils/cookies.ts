import type { CookieOptions, Response } from 'express';
import { config } from '../config';

export interface CookieNames {
  access: string;
  refresh: string;
  csrf: string;
}

/** __Host- (Path=/, no Domain, Secure) on access/csrf; __Secure- on the Path-scoped refresh cookie. */
export function cookieNamesFor(secure: boolean): CookieNames {
  return secure
    ? { access: '__Host-access_token', refresh: '__Secure-refresh_token', csrf: '__Host-csrf_token' }
    : { access: 'access_token', refresh: 'refresh_token', csrf: 'csrf_token' };
}

export const COOKIE_NAMES = cookieNamesFor(config.cookieSecure);
export const REFRESH_COOKIE_PATH = '/api/auth';

const DAY_MS = 86_400_000;
const base = (): CookieOptions => ({ secure: config.cookieSecure, sameSite: 'strict' });

// The access cookie outlives the (15 min) JWT on purpose: the expired JWT still carries the
// session id needed to bind CSRF tokens, and expiry itself is enforced by the JWT `exp`.
const accessOpts = (): CookieOptions => ({ ...base(), httpOnly: true, path: '/', maxAge: config.refreshTtlDays * DAY_MS });
const refreshOpts = (): CookieOptions => ({ ...base(), httpOnly: true, path: REFRESH_COOKIE_PATH, maxAge: config.refreshTtlDays * DAY_MS });
const csrfOpts = (): CookieOptions => ({ ...base(), httpOnly: false, path: '/', maxAge: config.refreshTtlDays * DAY_MS });

export function setAuthCookies(res: Response, tokens: { access: string; refresh: string }): void {
  res.cookie(COOKIE_NAMES.access, tokens.access, accessOpts());
  res.cookie(COOKIE_NAMES.refresh, tokens.refresh, refreshOpts());
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAMES.csrf, token, csrfOpts());
}

/** Always clears all three, idempotently. */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_NAMES.access, withoutMaxAge(accessOpts()));
  res.clearCookie(COOKIE_NAMES.refresh, withoutMaxAge(refreshOpts()));
  res.clearCookie(COOKIE_NAMES.csrf, withoutMaxAge(csrfOpts()));
}

function withoutMaxAge(opts: CookieOptions): CookieOptions {
  const copy = { ...opts };
  delete copy.maxAge;
  return copy;
}
