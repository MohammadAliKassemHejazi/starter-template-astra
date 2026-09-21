import type {
  AdminUpdateUserInput,
  Paginated,
  PaginationQuery,
  UpdateSelfInput,
  UserDto,
} from '@project/shared';
import { QueryTypes, UniqueConstraintError } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { Role, User, UserRole } from '../models';
import { badRequest, conflict, forbidden, notFound } from '../utils/app-error';
import { toUserDto } from '../utils/dto';
import { audit } from '../utils/logger';
import { hashPassword, verifyPassword } from '../utils/password';
import { paginate } from '../utils/respond';
import { assertAdminRemains, lockAdminGuard } from './admin-guard';
import { loadUserWithRoles } from './auth.service';
import { revokeAllForUser } from './token.service';

export interface Actor {
  userId: string;
  familyId: string;
  permissions: Set<string>;
}

export async function listUsers(q: PaginationQuery): Promise<Paginated<UserDto>> {
  const { rows, count } = await User.findAndCountAll({
    include: [{ model: Role, as: 'roles' }],
    order: [['createdAt', 'DESC'], ['id', 'ASC']],
    limit: q.pageSize,
    offset: (q.page - 1) * q.pageSize,
    distinct: true,
  });
  return paginate(rows.map(toUserDto), q.page, q.pageSize, count);
}

export async function getUser(id: string): Promise<UserDto> {
  const user = await loadUserWithRoles(id);
  if (!user) throw notFound('User not found');
  return toUserDto(user);
}

/** Self service: name, and password (needs current password; other sessions are revoked). */
export async function updateSelf(actor: Actor, input: UpdateSelfInput): Promise<UserDto> {
  const user = await User.findByPk(actor.userId);
  if (!user) throw notFound('User not found');
  const changes: Partial<{ name: string; passwordHash: string }> = {};
  if (input.name !== undefined) changes.name = input.name;
  if (input.newPassword !== undefined) {
    const ok = await verifyPassword(user.passwordHash, input.currentPassword ?? '');
    if (!ok) throw badRequest('Current password is incorrect', [{ field: 'currentPassword', issue: 'Incorrect password' }]);
    changes.passwordHash = await hashPassword(input.newPassword);
  }
  await sequelize.transaction(async (t) => {
    await user.update(changes, { transaction: t });
    if (changes.passwordHash) await revokeAllForUser(user.id, t, actor.familyId);
  });
  if (changes.passwordHash) audit('password_changed', { actorId: actor.userId, targetId: user.id });
  return getUser(user.id);
}

/** Admin update of ANOTHER user (self goes through updateSelf). */
export async function adminUpdateUser(actor: Actor, id: string, input: AdminUpdateUserInput): Promise<UserDto> {
  try {
    await sequelize.transaction(async (t) => {
      await lockAdminGuard(t);
      const user = await User.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!user) throw notFound('User not found');
      const deactivating = input.isActive === false && user.isActive;
      await user.update(input, { transaction: t });
      if (deactivating) await revokeAllForUser(user.id, t);
      if (deactivating) await assertAdminRemains(t);
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) throw conflict('An account with this email already exists');
    throw err;
  }
  audit('user_updated_by_admin', { actorId: actor.userId, targetId: id, fields: Object.keys(input) });
  return getUser(id);
}

export async function deleteUser(actor: Actor, id: string): Promise<void> {
  await sequelize.transaction(async (t) => {
    await lockAdminGuard(t);
    const user = await User.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) throw notFound('User not found');
    await user.destroy({ transaction: t }); // refresh tokens + user_roles cascade
    await assertAdminRemains(t);
  });
  audit('user_deleted', { actorId: actor.userId, targetId: id });
}

/** Permission keys of a set of roles. */
async function permissionKeysOf(roleIds: string[]): Promise<Set<string>> {
  if (roleIds.length === 0) return new Set();
  const rows = await sequelize.query<{ key: string }>(
    `SELECT DISTINCT p.key FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id IN (:ids)`,
    { replacements: { ids: roleIds }, type: QueryTypes.SELECT },
  );
  return new Set(rows.map((r) => r.key));
}

const isSubset = (sub: Set<string>, sup: Set<string>): boolean => [...sub].every((k) => sup.has(k));

export async function assignRoles(actor: Actor, id: string, roleIds: string[]): Promise<UserDto> {
  if (id === actor.userId) throw forbidden('You cannot change your own roles');
  const wanted = [...new Set(roleIds)];
  await sequelize.transaction(async (t) => {
    await lockAdminGuard(t);
    const user = await User.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) throw notFound('User not found');
    const existing = wanted.length ? await Role.findAll({ where: { id: wanted }, transaction: t }) : [];
    if (existing.length !== wanted.length) throw badRequest('One or more roles do not exist', [{ field: 'roleIds', issue: 'Unknown role' }]);

    const current = (await UserRole.findAll({ where: { userId: id }, transaction: t })).map((ur) => ur.roleId);
    const changed = [...wanted.filter((r) => !current.includes(r)), ...current.filter((r) => !wanted.includes(r))];
    // An assigner may only grant/revoke roles whose permissions are a subset of their own.
    if (!isSubset(await permissionKeysOf(changed), actor.permissions)) {
      throw forbidden('You cannot grant or revoke roles with permissions you do not hold');
    }
    await UserRole.destroy({ where: { userId: id }, transaction: t });
    if (wanted.length) await UserRole.bulkCreate(wanted.map((roleId) => ({ userId: id, roleId })), { transaction: t });
    await revokeAllForUser(id, t); // role change invalidates sessions in the same txn
    await assertAdminRemains(t);
  });
  audit('roles_assigned', { actorId: actor.userId, targetId: id, roleIds: wanted });
  return getUser(id);
}
