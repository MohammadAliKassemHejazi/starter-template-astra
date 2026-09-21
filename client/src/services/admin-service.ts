import type {
  AdminUpdateUserInput,
  AssignRolesInput,
  CreateRoleInput,
  PaginatedData,
  PermissionDto,
  RoleDto,
  SetRolePermissionsInput,
  UserDto,
} from '@project/shared';
import { http } from './http-client';

export async function listUsers(page: number, pageSize: number): Promise<PaginatedData<UserDto>> {
  const res = await http.get<PaginatedData<UserDto>>('/api/users', { params: { page, pageSize } });
  return res.data;
}

export async function updateUser(id: string, input: AdminUpdateUserInput): Promise<UserDto> {
  const res = await http.patch<UserDto>(`/api/users/${id}`, input);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete(`/api/users/${id}`);
}

export async function assignUserRoles(id: string, input: AssignRolesInput): Promise<UserDto> {
  const res = await http.put<UserDto>(`/api/users/${id}/roles`, input);
  return res.data;
}

// The list endpoints return plain arrays; tolerate an `{ items }` page shape too.
function asList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : data.items;
}

export async function listRoles(): Promise<RoleDto[]> {
  const res = await http.get<RoleDto[] | { items: RoleDto[] }>('/api/roles');
  return asList(res.data);
}

export async function listPermissions(): Promise<PermissionDto[]> {
  const res = await http.get<PermissionDto[] | { items: PermissionDto[] }>('/api/permissions');
  return asList(res.data);
}

export async function createRole(input: CreateRoleInput): Promise<RoleDto> {
  const res = await http.post<RoleDto>('/api/roles', input);
  return res.data;
}

export async function setRolePermissions(id: string, input: SetRolePermissionsInput): Promise<RoleDto> {
  const res = await http.put<RoleDto>(`/api/roles/${id}/permissions`, input);
  return res.data;
}
