import type { RequestHandler } from 'express';
import type { Permission } from '@project/shared';
import { forbidden, unauthorized } from '../utils/app-error';

/** Must run after `authenticate`. Permissions come from the DB per request, never from the token. */
export const requirePermission =
  (...required: Permission[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    return required.every((p) => req.auth?.permissions.has(p)) ? next() : next(forbidden());
  };

/** Self access to `:id` OR the permission. */
export const requireSelfOrPermission =
  (permission: Permission): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(unauthorized());
    if (req.params.id === req.auth.userId || req.auth.permissions.has(permission)) return next();
    return next(forbidden());
  };
