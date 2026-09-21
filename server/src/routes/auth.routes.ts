import { Router, type RequestHandler } from 'express';
import { loginSchema, registerSchema } from '@project/shared';
import {
  csrfController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  registrationGuard,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { csrfProtection } from '../middlewares/csrf';
import { validate } from '../middlewares/validate';

export interface AuthLimiters {
  auth: RequestHandler;
  login: RequestHandler;
}

const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

export function createAuthRouter(limiters: AuthLimiters): Router {
  const r = Router();
  r.use(noStore);
  // Per-IP limiter runs first on every credential-bearing route: before CSRF, validation and hashing.
  r.get('/csrf', csrfController);
  r.post('/register', limiters.auth, csrfProtection, registrationGuard, validate({ body: registerSchema }), registerController);
  r.post('/login', limiters.auth, csrfProtection, limiters.login, validate({ body: loginSchema }), loginController);
  r.post('/refresh', limiters.auth, csrfProtection, refreshController);
  r.post('/logout', limiters.auth, csrfProtection, logoutController);
  r.get('/me', authenticate, meController);
  return r;
}
