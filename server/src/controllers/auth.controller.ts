import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { LoginInput, RegisterInput } from '@project/shared';
import { config } from '../config';
import { csrfBinding, issueCsrfToken } from '../middlewares/csrf';
import * as authService from '../services/auth.service';
import type { ClientMeta } from '../services/token.service';
import { AppError, forbidden, unauthorized } from '../utils/app-error';
import { clearAuthCookies, COOKIE_NAMES, setAuthCookies, setCsrfCookie } from '../utils/cookies';
import { sendSuccess } from '../utils/respond';

type Handler = (req: Request, res: Response) => Promise<unknown> | unknown;
const wrap =
  (fn: Handler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

const metaOf = (req: Request): ClientMeta => ({ ip: req.ip, userAgent: req.get('user-agent') });
const cookieOf = (req: Request, name: string): string | undefined =>
  (req.cookies as Record<string, string | undefined> | undefined)?.[name];

/** 403 when registration is disabled (checked before validation and hashing). */
export const registrationGuard: RequestHandler = (_req, _res, next) =>
  config.allowRegistration ? next() : next(forbidden('Registration is disabled'));

export const csrfController = wrap((req, res) => {
  const csrfToken = issueCsrfToken(csrfBinding(req));
  setCsrfCookie(res, csrfToken);
  return sendSuccess(res, { csrfToken });
});

export const registerController = wrap(async (req, res) => {
  const user = await authService.register(req.body as RegisterInput, metaOf(req));
  return sendSuccess(res, user, 'Registered', 201);
});

export const loginController = wrap(async (req, res) => {
  const { session, familyId, accessToken, refreshToken } = await authService.login(req.body as LoginInput, metaOf(req));
  setAuthCookies(res, { access: accessToken, refresh: refreshToken });
  // Fresh CSRF cookie bound to the NEW session (the pre-login one was bound to "anon").
  setCsrfCookie(res, issueCsrfToken(familyId));
  return sendSuccess(res, session, 'Logged in');
});

export const refreshController = wrap(async (req, res) => {
  try {
    const t = await authService.refresh(cookieOf(req, COOKIE_NAMES.refresh), metaOf(req));
    setAuthCookies(res, { access: t.accessToken, refresh: t.refreshToken });
    return sendSuccess(res, null, 'Session refreshed');
  } catch (err) {
    // Only a definitive "session is dead" clears cookies; a transient 500 must not log the user out.
    if (err instanceof AppError && err.status === 401) clearAuthCookies(res);
    throw err;
  }
});

export const logoutController = wrap(async (req, res) => {
  await authService.logout(cookieOf(req, COOKIE_NAMES.refresh), metaOf(req));
  clearAuthCookies(res);
  return sendSuccess(res, null, 'Logged out');
});

export const meController = wrap(async (req, res) => {
  if (!req.auth) throw unauthorized();
  return sendSuccess(res, await authService.buildSession(req.auth.userId));
});
