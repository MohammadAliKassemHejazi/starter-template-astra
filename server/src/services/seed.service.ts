import { emailSchema, passwordSchema, PERMISSION_KEYS, UserRole as SystemRole } from '@project/shared';
import { QueryTypes, UniqueConstraintError } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { Permission, Role, RolePermission, User, UserRole } from '../models';
import { hashPassword } from '../utils/password';

const DESCRIPTIONS: Record<string, string> = {
  'users:read': 'List and view users',
  'users:write': 'Edit other users (name, email, active state)',
  'users:delete': 'Delete users',
  'users:assign-role': 'Assign roles to users (root-equivalent with roles:write)',
  'roles:read': 'View roles and permissions',
  'roles:write': 'Create/edit roles and their permissions (root-equivalent)',
};

/** Idempotent: permissions, the two system roles, and the admin role's full permission set. */
export async function seedRolesAndPermissions(): Promise<void> {
  await sequelize.transaction(async (t) => {
    for (const key of PERMISSION_KEYS) {
      await Permission.findOrCreate({ where: { key }, defaults: { key, description: DESCRIPTIONS[key] ?? null }, transaction: t });
    }
    const [admin] = await Role.findOrCreate({
      where: { name: SystemRole.Admin },
      defaults: { name: SystemRole.Admin, description: 'Full access', isSystem: true },
      transaction: t,
    });
    await Role.findOrCreate({
      where: { name: SystemRole.User },
      defaults: { name: SystemRole.User, description: 'Default role, no admin permissions', isSystem: true },
      transaction: t,
    });
    await Role.update({ isSystem: true }, { where: { name: [SystemRole.Admin, SystemRole.User] }, transaction: t });
    const perms = await Permission.findAll({ transaction: t });
    for (const p of perms) {
      await RolePermission.findOrCreate({ where: { roleId: admin.id, permissionId: p.id }, transaction: t });
    }
  });
}

/** Creates the first admin only if the email does not exist yet (never overwrites a password). */
export async function seedAdminUser(email: string, password: string): Promise<'created' | 'exists'> {
  const cleanEmail = emailSchema.parse(email);
  const cleanPassword = passwordSchema.parse(password);
  const existing = await User.findOne({ where: { email: cleanEmail } });
  if (existing) return 'exists';
  const passwordHash = await hashPassword(cleanPassword);
  try {
  await sequelize.transaction(async (t) => {
    const user = await User.create({ email: cleanEmail, passwordHash, name: 'Administrator' }, { transaction: t });
    const admin = await Role.findOne({ where: { name: SystemRole.Admin }, transaction: t });
    if (!admin) throw new Error('admin role missing; run seedRolesAndPermissions first');
    await UserRole.create({ userId: user.id, roleId: admin.id }, { transaction: t });
  });
  } catch (err) {
    if (err instanceof UniqueConstraintError) return 'exists'; // concurrent seeder won the race
    throw err;
  }
  return 'created';
}

export async function rowCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const table of ['users', 'roles', 'permissions', 'user_roles', 'role_permissions']) {
    const rows = await sequelize.query<{ n: string }>(`SELECT count(*)::text AS n FROM ${table}`, { type: QueryTypes.SELECT });
    out[table] = Number(rows[0]?.n ?? 0);
  }
  return out;
}
