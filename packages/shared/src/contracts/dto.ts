import type { Paginated } from './api';
import type { Permission } from '../enums';

export interface PermissionDto {
  id: string;
  key: string;
  description: string | null;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions?: PermissionDto[];
}

/** Public user shape: never contains passwordHash or token material. */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: RoleDto[];
}

export interface AuthSessionDto {
  user: UserDto;
  permissions: Permission[];
}

export type PaginatedData<T> = Paginated<T>;
