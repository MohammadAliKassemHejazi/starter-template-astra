import { describe, expect, it } from 'vitest';
import {
  adminUpdateUserSchema,
  assignRolesSchema,
  createRoleSchema,
  loginSchema,
  paginationQuerySchema,
  registerSchema,
  setRolePermissionsSchema,
  updateRoleSchema,
  updateSelfSchema,
} from '../index';

const pw = 'a-very-long-password';
const id = '3f2b8c1e-5d4a-4b6f-9a1e-2c7d8e9f0a1b';

describe('registerSchema', () => {
  it('trims and lowercases email', () => {
    const r = registerSchema.parse({ email: '  Foo@Bar.COM ', password: pw, name: ' Ann ' });
    expect(r.email).toBe('foo@bar.com');
    expect(r.name).toBe('Ann');
  });
  it('rejects mass-assignment fields', () => {
    expect(registerSchema.safeParse({ email: 'a@b.co', password: pw, name: 'A', roles: ['admin'] }).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'a@b.co', password: pw, name: 'A', isActive: true }).success).toBe(false);
  });
  it('enforces password 12..128', () => {
    const base = { email: 'a@b.co', name: 'A' };
    expect(registerSchema.safeParse({ ...base, password: 'x'.repeat(11) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'x'.repeat(12) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: 'x'.repeat(128) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: 'x'.repeat(129) }).success).toBe(false);
  });
  it('rejects bad email', () => {
    expect(registerSchema.safeParse({ email: 'nope', password: pw, name: 'A' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('normalizes email, rejects 129-char password and extras', () => {
    expect(loginSchema.parse({ email: ' A@B.co ', password: 'x' }).email).toBe('a@b.co');
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(129) }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x', role: 'admin' }).success).toBe(false);
  });
});

describe('updateSelfSchema', () => {
  it('allows name only', () => {
    expect(updateSelfSchema.safeParse({ name: 'B' }).success).toBe(true);
  });
  it('requires currentPassword with newPassword', () => {
    expect(updateSelfSchema.safeParse({ newPassword: pw }).success).toBe(false);
    expect(updateSelfSchema.safeParse({ newPassword: pw, currentPassword: 'old' }).success).toBe(true);
  });
  it('rejects empty and admin-only fields', () => {
    expect(updateSelfSchema.safeParse({}).success).toBe(false);
    expect(updateSelfSchema.safeParse({ name: 'B', isActive: false }).success).toBe(false);
    expect(updateSelfSchema.safeParse({ name: 'B', email: 'a@b.co' }).success).toBe(false);
  });
});

describe('adminUpdateUserSchema', () => {
  it('accepts fields, normalizes email', () => {
    expect(adminUpdateUserSchema.parse({ email: 'X@Y.io', isActive: false })).toEqual({
      email: 'x@y.io',
      isActive: false,
    });
  });
  it('rejects empty, roles, password', () => {
    expect(adminUpdateUserSchema.safeParse({}).success).toBe(false);
    expect(adminUpdateUserSchema.safeParse({ name: 'A', roles: [] }).success).toBe(false);
    expect(adminUpdateUserSchema.safeParse({ name: 'A', newPassword: pw }).success).toBe(false);
  });
});

describe('role schemas', () => {
  it('assignRoles validates uuids and strictness', () => {
    expect(assignRolesSchema.safeParse({ roleIds: [id] }).success).toBe(true);
    expect(assignRolesSchema.safeParse({ roleIds: ['1'] }).success).toBe(false);
    expect(assignRolesSchema.safeParse({ roleIds: [], x: 1 }).success).toBe(false);
  });
  it('createRole / updateRole', () => {
    expect(createRoleSchema.safeParse({ name: 'editor' }).success).toBe(true);
    expect(createRoleSchema.safeParse({ name: 'bad name!' }).success).toBe(false);
    expect(createRoleSchema.safeParse({ name: 'editor', isSystem: true }).success).toBe(false);
    expect(updateRoleSchema.safeParse({}).success).toBe(false);
  });
  it('setRolePermissions', () => {
    expect(setRolePermissionsSchema.safeParse({ permissionIds: [id] }).success).toBe(true);
    expect(setRolePermissionsSchema.safeParse({ permissionIds: ['x'] }).success).toBe(false);
  });
});

describe('paginationQuerySchema', () => {
  it('coerces and defaults', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationQuerySchema.parse({ page: '2', pageSize: '50' })).toEqual({ page: 2, pageSize: 50 });
  });
  it('rejects out of range and unknown', () => {
    expect(paginationQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ sort: 'x' }).success).toBe(false);
  });
});
