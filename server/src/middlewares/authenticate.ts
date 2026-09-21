import type { RequestHandler } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { verifyAccessToken } from '../services/token.service';
import { unauthorized } from '../utils/app-error';
import { COOKIE_NAMES } from '../utils/cookies';

interface AuthRow {
  is_active: boolean;
  family_ok: boolean;
  permissions: string[];
  roles: string[];
}

/**
 * Cookie-only (no Authorization header fallback). Every request re-checks, in ONE query, that the
 * user is active, the session family is live and belongs to `sub`, and loads roles/permissions
 * from the DB, so deactivation, logout and role changes take effect immediately.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const token = cookies?.[COOKIE_NAMES.access];
    const claims = token ? verifyAccessToken(token) : null;
    if (!claims) return next(unauthorized());

    const rows = await sequelize.query<AuthRow>(
      `SELECT u.is_active,
         EXISTS (SELECT 1 FROM refresh_tokens t
                 WHERE t.family_id = :fid AND t.user_id = u.id AND t.revoked_at IS NULL
                   AND t.family_expires_at > now()) AS family_ok,
         COALESCE(array_agg(DISTINCT p.key) FILTER (WHERE p.key IS NOT NULL), '{}') AS permissions,
         COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = :sub
       GROUP BY u.id`,
      { replacements: { sub: claims.sub, fid: claims.fid }, type: QueryTypes.SELECT },
    );
    const row = rows[0];
    if (!row || !row.is_active || !row.family_ok) return next(unauthorized());

    req.auth = {
      userId: claims.sub,
      familyId: claims.fid,
      roles: row.roles,
      permissions: new Set(row.permissions),
    };
    next();
  } catch (err) {
    next(err);
  }
};
