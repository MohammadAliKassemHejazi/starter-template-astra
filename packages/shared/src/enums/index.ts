export const UserRole = {
  Admin: 'admin',
  User: 'user',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Permission = {
  UsersRead: 'users:read',
  UsersWrite: 'users:write',
  UsersDelete: 'users:delete',
  UsersAssignRole: 'users:assign-role',
  RolesRead: 'roles:read',
  RolesWrite: 'roles:write',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export const PERMISSION_KEYS = Object.values(Permission) as Permission[];
