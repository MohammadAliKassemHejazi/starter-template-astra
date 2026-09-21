import { QueryTypes, type Transaction } from 'sequelize';
import { Permission } from '@project/shared';
import { sequelize } from '../db/sequelize';
import { conflict } from '../utils/app-error';

const ADMIN_LOCK_KEY = 872_002;

/** Serialises every mutation that can remove administrative capability (released at commit/rollback). */
export async function lockAdminGuard(t: Transaction): Promise<void> {
  await sequelize.query('SELECT pg_advisory_xact_lock(:k)', { replacements: { k: ADMIN_LOCK_KEY }, transaction: t });
}

/**
 * Last-admin protection by EFFECTIVE permission: after the mutation (same txn, lock held) at least one
 * ACTIVE user must still hold both `roles:write` and `users:assign-role` through their roles.
 */
export async function assertAdminRemains(t: Transaction): Promise<void> {
  const rows = await sequelize.query<{ id: string }>(
    `SELECT u.id FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE u.is_active AND p.key IN (:keys)
     GROUP BY u.id HAVING COUNT(DISTINCT p.key) = :n LIMIT 1`,
    {
      replacements: { keys: [Permission.RolesWrite, Permission.UsersAssignRole], n: 2 },
      type: QueryTypes.SELECT,
      transaction: t,
    },
  );
  if (rows.length === 0) throw conflict('This change would leave no active administrator');
}
