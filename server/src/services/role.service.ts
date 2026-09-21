import type { CreateRoleInput, PermissionDto, RoleDto, SetRolePermissionsInput, UpdateRoleInput } from '@project/shared';
import { UniqueConstraintError } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { Permission, Role, RolePermission } from '../models';
import { badRequest, conflict, forbidden, notFound } from '../utils/app-error';
import { toPermissionDto, toRoleDto } from '../utils/dto';
import { audit } from '../utils/logger';
import { assertAdminRemains, lockAdminGuard } from './admin-guard';
import type { Actor } from './user.service';

const SYSTEM_MSG = 'System roles cannot be modified or deleted';

async function loadRole(id: string): Promise<Role> {
  const role = await Role.findByPk(id, { include: [{ model: Permission, as: 'permissions' }] });
  if (!role) throw notFound('Role not found');
  return role;
}

export async function listRoles(): Promise<RoleDto[]> {
  const roles = await Role.findAll({ include: [{ model: Permission, as: 'permissions' }], order: [['name', 'ASC']] });
  return roles.map((r) => toRoleDto(r, true));
}

export async function listPermissions(): Promise<PermissionDto[]> {
  const perms = await Permission.findAll({ order: [['key', 'ASC']] });
  return perms.map(toPermissionDto);
}

export async function createRole(actor: Actor, input: CreateRoleInput): Promise<RoleDto> {
  try {
    const role = await Role.create({ name: input.name, description: input.description ?? null, isSystem: false });
    audit('role_created', { actorId: actor.userId, targetId: role.id });
    return toRoleDto(await loadRole(role.id), true);
  } catch (err) {
    if (err instanceof UniqueConstraintError) throw conflict('A role with this name already exists');
    throw err;
  }
}

export async function updateRole(actor: Actor, id: string, input: UpdateRoleInput): Promise<RoleDto> {
  const role = await Role.findByPk(id);
  if (!role) throw notFound('Role not found');
  if (role.isSystem) throw forbidden(SYSTEM_MSG);
  try {
    await role.update(input);
  } catch (err) {
    if (err instanceof UniqueConstraintError) throw conflict('A role with this name already exists');
    throw err;
  }
  audit('role_updated', { actorId: actor.userId, targetId: id });
  return toRoleDto(await loadRole(id), true);
}

export async function deleteRole(actor: Actor, id: string): Promise<void> {
  await sequelize.transaction(async (t) => {
    await lockAdminGuard(t);
    const role = await Role.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!role) throw notFound('Role not found');
    if (role.isSystem) throw forbidden(SYSTEM_MSG);
    await role.destroy({ transaction: t });
    await assertAdminRemains(t);
  });
  audit('role_deleted', { actorId: actor.userId, targetId: id });
}

/** Replaces a custom role's permission set. System roles (incl. admin) are immutable. */
export async function setRolePermissions(actor: Actor, id: string, input: SetRolePermissionsInput): Promise<RoleDto> {
  const wanted = [...new Set(input.permissionIds)];
  await sequelize.transaction(async (t) => {
    await lockAdminGuard(t);
    const role = await Role.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!role) throw notFound('Role not found');
    if (role.isSystem) throw forbidden(SYSTEM_MSG);
    const perms = wanted.length ? await Permission.findAll({ where: { id: wanted }, transaction: t }) : [];
    if (perms.length !== wanted.length) {
      throw badRequest('One or more permissions do not exist', [{ field: 'permissionIds', issue: 'Unknown permission' }]);
    }
    if (perms.some((p) => !actor.permissions.has(p.key))) throw forbidden('You cannot grant permissions you do not hold');
    await RolePermission.destroy({ where: { roleId: id }, transaction: t });
    if (wanted.length) {
      await RolePermission.bulkCreate(wanted.map((permissionId) => ({ roleId: id, permissionId })), { transaction: t });
    }
    await assertAdminRemains(t);
  });
  audit('role_permissions_set', { actorId: actor.userId, targetId: id, permissionIds: wanted });
  return toRoleDto(await loadRole(id), true);
}
