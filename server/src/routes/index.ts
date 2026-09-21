import { Router } from 'express';
import { createLimiters, type RateLimitOptions } from '../middlewares/rateLimit';
import { permissionsRouter, rolesRouter, usersRouter } from './admin.routes';
import { createAuthRouter } from './auth.routes';
import { healthRouter } from './health.routes';

export function createApiRouter(rateLimit?: RateLimitOptions): Router {
  const limiters = createLimiters(rateLimit);
  const api = Router();
  api.use(limiters.general);
  api.use('/health', healthRouter);
  api.use('/auth', createAuthRouter({ auth: limiters.auth, login: limiters.login }));
  api.use('/users', usersRouter);
  api.use('/roles', rolesRouter);
  api.use('/permissions', permissionsRouter);
  return api;
}
