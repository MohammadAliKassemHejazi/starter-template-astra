import type { PermissionDto, RoleDto, UserDto } from '@project/shared';
import type { Permission, Role, User } from '../models';

export const toPermissionDto = (p: Permission): PermissionDto => ({ id: p.id, key: p.key, description: p.description });

export function toRoleDto(r: Role, withPermissions = false): RoleDto {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    ...(withPermissions ? { permissions: (r.permissions ?? []).map(toPermissionDto) } : {}),
  };
}

/** The only user shape that leaves the server: no hash, no token material. */
export function toUserDto(u: User): UserDto {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    roles: (u.roles ?? []).map((r) => toRoleDto(r)),
  };
}
