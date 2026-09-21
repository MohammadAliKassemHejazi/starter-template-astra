import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { PERMISSION_KEYS } from '@project/shared';
import { Permission, Role } from '../models';
import { rowCounts, seedAdminUser, seedRolesAndPermissions } from '../services/seed.service';
import { createUser, loginAs, makeClient, ORIGIN, PASSWORD, type Client } from './helpers';

const UUID = '11111111-1111-4111-8111-111111111111';

async function roleId(name: string): Promise<string> {
  const r = await Role.findOne({ where: { name } });
  if (!r) throw new Error(`role ${name} missing`);
  return r.id;
}
async function permIds(keys: string[]): Promise<string[]> {
  return (await Permission.findAll({ where: { key: keys } })).map((p) => p.id);
}
/** Creates a custom role with the given permission keys through the real API as `admin`. */
async function customRole(admin: Client, name: string, keys: string[]): Promise<string> {
  const created = await admin.post('/api/roles', { name });
  expect(created.status).toBe(201);
  const id = created.body.data.id as string;
  const set = await admin.put(`/api/roles/${id}/permissions`, { permissionIds: await permIds(keys) });
  expect(set.status).toBe(200);
  return id;
}

describe('authorization matrix', () => {
  const endpoints: { method: 'get' | 'post' | 'patch' | 'put' | 'delete'; path: string }[] = [
    { method: 'get', path: '/api/users' },
    { method: 'get', path: `/api/users/${UUID}` },
    { method: 'patch', path: `/api/users/${UUID}` },
    { method: 'delete', path: `/api/users/${UUID}` },
    { method: 'put', path: `/api/users/${UUID}/roles` },
    { method: 'get', path: '/api/roles' },
    { method: 'post', path: '/api/roles' },
    { method: 'patch', path: `/api/roles/${UUID}` },
    { method: 'delete', path: `/api/roles/${UUID}` },
    { method: 'put', path: `/api/roles/${UUID}/permissions` },
    { method: 'get', path: '/api/permissions' },
  ];

  it.each(endpoints)('$method $path: anonymous -> 401', async ({ method, path }) => {
    const res = await request(createApp())[method](path).set('Origin', ORIGIN).send({});
    // unsafe methods hit csrf first (403) only if authenticated; authenticate runs before csrf, so 401
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it.each(endpoints)(
    '$method $path: plain user -> 403',
    async ({ method, path }) => {
      await createUser({ email: 'plain@example.com' });
      const c = await loginAs('plain@example.com');
      const res =
        method === 'get'
          ? await c.get(path)
          : method === 'post'
            ? await c.post(path, {})
            : method === 'patch'
              ? await c.patch(path, {})
              : method === 'put'
                ? await c.put(path, {})
                : await c.del(path);
      expect(res.status).toBe(403);
    },
  );

  it('unsafe admin routes require CSRF even when authenticated', async () => {
    await createUser({ email: 'root@example.com', roles: ['admin'] });
    const c = await loginAs('root@example.com');
    const res = await c.agent.post('/api/roles').set('Origin', ORIGIN).send({ name: 'nocsrf' });
    expect(res.status).toBe(403);
  });

  it('unknown routes and bad input use the error envelope', async () => {
    await createUser({ email: 'root@example.com', roles: ['admin'] });
    const c = await loginAs('root@example.com');
    const nf = await c.get('/api/nope');
    expect(nf.status).toBe(404);
    expect(nf.body).toMatchObject({ success: false, message: expect.any(String) });
    const bad = await c.get('/api/users/not-a-uuid');
    expect(bad.status).toBe(400);
    expect(bad.body.errors[0]).toHaveProperty('field');
    expect((await c.post('/api/roles', { name: 'ok-role', extra: 1 })).status).toBe(400);
  });
});

describe('users API', () => {
  it('admin lists users paginated, without hashes; roles/permissions return arrays', async () => {
    await createUser({ email: 'root@example.com', roles: ['admin'] });
    await createUser({ email: 'u1@example.com' });
    await createUser({ email: 'u2@example.com' });
    const c = await loginAs('root@example.com');
    const res = await c.get('/api/users?page=1&pageSize=2');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination).toMatchObject({ currentPage: 1, pageSize: 2, totalItems: 3, totalPages: 2 });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);
    expect((await c.get('/api/users?pageSize=1000')).status).toBe(400);
    const roles = await c.get('/api/roles');
    expect(Array.isArray(roles.body.data)).toBe(true);
    const perms = await c.get('/api/permissions');
    expect(Array.isArray(perms.body.data)).toBe(true);
    expect(perms.body.data.map((p: { key: string }) => p.key).sort()).toEqual([...PERMISSION_KEYS].sort());
  });

  it('a user may read self but not others', async () => {
    const me = await createUser({ email: 'me@example.com' });
    const other = await createUser({ email: 'other@example.com' });
    const c = await loginAs('me@example.com');
    expect((await c.get(`/api/users/${me.id}`)).status).toBe(200);
    expect((await c.get(`/api/users/${other.id}`)).status).toBe(403);
  });

  it('self PATCH: name and password only; is_active/email/roles rejected', async () => {
    const me = await createUser({ email: 'me@example.com' });
    const c = await loginAs('me@example.com');
    for (const body of [{ isActive: false }, { email: 'x@example.com' }, { roles: ['admin'] }, { name: 'N', isActive: true }]) {
      expect((await c.patch(`/api/users/${me.id}`, body)).status).toBe(400);
    }
    expect((await c.patch(`/api/users/${me.id}`, { newPassword: 'another-long-password-1' })).status).toBe(400);
    expect((await c.patch(`/api/users/${me.id}`, { newPassword: 'another-long-password-1', currentPassword: 'wrong' })).status).toBe(400);
    const ok = await c.patch(`/api/users/${me.id}`, { name: 'Renamed' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe('Renamed');
  });

  it('self password change keeps this session, revokes the others', async () => {
    const me = await createUser({ email: 'me@example.com' });
    const a = await loginAs('me@example.com');
    const b = await loginAs('me@example.com');
    const res = await a.patch(`/api/users/${me.id}`, { newPassword: 'another-long-password-1', currentPassword: PASSWORD });
    expect(res.status).toBe(200);
    expect((await a.get('/api/auth/me')).status).toBe(200);
    expect((await b.get('/api/auth/me')).status).toBe(401);
    expect((await makeClient().post('/api/auth/login', { email: 'me@example.com', password: 'another-long-password-1' })).status).toBe(200);
  });

  it('users:write is required to edit others; deactivation revokes their sessions at once', async () => {
    await createUser({ email: 'root@example.com', roles: ['admin'] });
    const target = await createUser({ email: 'target@example.com' });
    const plain = await createUser({ email: 'plain@example.com' });
    const admin = await loginAs('root@example.com');
    const victim = await loginAs('target@example.com');
    const p = await loginAs('plain@example.com');
    expect((await p.patch(`/api/users/${target.id}`, { name: 'Hacked' })).status).toBe(403);
    expect((await admin.patch(`/api/users/${target.id}`, { name: 'Edited', email: 'new@example.com' })).status).toBe(200);
    expect((await admin.patch(`/api/users/${target.id}`, { isActive: false })).status).toBe(200);
    expect((await victim.get('/api/auth/me')).status).toBe(401);
    expect((await admin.patch(`/api/users/${plain.id}`, { email: 'new@example.com' })).status).toBe(409);
    expect((await admin.patch(`/api/users/${UUID}`, { name: 'x' })).status).toBe(404);
  });

  it('assigning roles: not yourself, must exist, revokes the target sessions', async () => {
    const root = await createUser({ email: 'root@example.com', roles: ['admin'] });
    const target = await createUser({ email: 'target@example.com' });
    const admin = await loginAs('root@example.com');
    const t = await loginAs('target@example.com');
    expect((await admin.put(`/api/users/${root.id}/roles`, { roleIds: [await roleId('user')] })).status).toBe(403);
    expect((await admin.put(`/api/users/${target.id}/roles`, { roleIds: [UUID] })).status).toBe(400);
    const ok = await admin.put(`/api/users/${target.id}/roles`, { roleIds: [await roleId('user'), await roleId('admin')] });
    expect(ok.status).toBe(200);
    expect(ok.body.data.roles.map((r: { name: string }) => r.name).sort()).toEqual(['admin', 'user']);
    expect((await t.get('/api/auth/me')).status).toBe(401); // role change killed the old session
    const again = await loginAs('target@example.com');
    expect((await again.get('/api/users')).status).toBe(200);
  });

  it('an assigner cannot grant a role holding permissions they lack (no escalation)', async () => {
    await createUser({ email: 'root@example.com', roles: ['admin'] });
    const target = await createUser({ email: 'target@example.com' });
    const admin = await loginAs('root@example.com');
    const opsRole = await customRole(admin, 'ops', ['users:read', 'users:assign-role']);
    const opsUser = await createUser({ email: 'ops2@example.com', roles: [] });
    expect((await admin.put(`/api/users/${opsUser.id}/roles`, { roleIds: [opsRole] })).status).toBe(200);
    const ops = await loginAs('ops2@example.com');
    // ops may grant roles that are subsets of its own permissions...
    expect((await ops.put(`/api/users/${target.id}/roles`, { roleIds: [opsRole] })).status).toBe(200);
    // ...but not the admin role
    const denied = await ops.put(`/api/users/${target.id}/roles`, { roleIds: [await roleId('admin')] });
    expect(denied.status).toBe(403);
  });
});

describe('id casing cannot bypass self checks', () => {
  it('uppercase own id still counts as self (no admin path, no self role change)', async () => {
    const root = await createUser({ email: 'root@example.com', roles: ['admin'] });
    const c = await loginAs('root@example.com');
    const upper = root.id.toUpperCase();
    expect((await c.patch(`/api/users/${upper}`, { isActive: false })).status).toBe(400); // self schema is strict
    expect((await c.patch(`/api/users/${upper}`, { email: 'x@example.com' })).status).toBe(400);
    expect((await c.put(`/api/users/${upper}/roles`, { roleIds: [await roleId('user')] })).status).toBe(403);
  });
});

describe('last-admin protection (by effective permission)', () => {
  it('cannot delete the last administrator; can once another exists', async () => {
    const a = await createUser({ email: 'a@example.com', roles: ['admin'] });
    const b = await createUser({ email: 'b@example.com', roles: ['admin'] });
    const ca = await loginAs('a@example.com');
    expect((await ca.del(`/api/users/${b.id}`)).status).toBe(200);
    const res = await ca.del(`/api/users/${a.id}`);
    expect(res.status).toBe(409);
    expect((await ca.get('/api/auth/me')).status).toBe(200);
  });

  it('cannot deactivate the last administrator', async () => {
    await createUser({ email: 'a@example.com', roles: ['admin'] });
    const ops = await createUser({ email: 'ops@example.com', roles: [] });
    const admin = await loginAs('a@example.com');
    const role = await customRole(admin, 'user-manager', ['users:read', 'users:write']);
    await admin.put(`/api/users/${ops.id}/roles`, { roleIds: [role] });
    const mgr = await loginAs('ops@example.com');
    const target = (await mgr.get('/api/users')).body.data.items.find((u: { email: string }) => u.email === 'a@example.com');
    const res = await mgr.patch(`/api/users/${target.id}`, { isActive: false });
    expect(res.status).toBe(409);
  });

  it('cannot delete a role that would leave no administrator', async () => {
    await createUser({ email: 'a@example.com', roles: ['admin'] });
    const b = await createUser({ email: 'b@example.com', roles: [] });
    const a = await loginAs('a@example.com');
    const superRole = await customRole(a, 'super', [...PERMISSION_KEYS]);
    await a.put(`/api/users/${b.id}/roles`, { roleIds: [superRole] });
    const bc = await loginAs('b@example.com');
    // deactivate a (allowed: b keeps both permissions via "super")
    const rows = (await bc.get('/api/users')).body.data.items as { id: string; email: string }[];
    const aId = rows.find((u) => u.email === 'a@example.com')?.id;
    expect((await bc.patch(`/api/users/${aId}`, { isActive: false })).status).toBe(200);
    // now deleting "super" would leave zero effective administrators
    expect((await bc.del(`/api/roles/${superRole}`)).status).toBe(409);
    expect((await bc.get('/api/roles')).body.data.some((r: { name: string }) => r.name === 'super')).toBe(true);
  });
});

describe('last-admin guard under concurrency', () => {
  it('two admins deactivating each other at once: exactly one wins, one admin remains', async () => {
    const a = await createUser({ email: 'a@example.com', roles: ['admin'] });
    const b = await createUser({ email: 'b@example.com', roles: ['admin'] });
    const ca = await loginAs('a@example.com');
    const cb = await loginAs('b@example.com');
    const [r1, r2] = await Promise.all([ca.patch(`/api/users/${b.id}`, { isActive: false }), cb.patch(`/api/users/${a.id}`, { isActive: false })]);
    expect([r1.status, r2.status].sort()).toEqual([200, 409]);
  });
});

describe('roles API', () => {
  it('creates, edits and deletes custom roles; duplicates conflict', async () => {
    await createUser({ email: 'root@example.com', roles: ['admin'] });
    const c = await loginAs('root@example.com');
    const created = await c.post('/api/roles', { name: 'editors', description: 'Content editors' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ name: 'editors', isSystem: false });
    expect((await c.post('/api/roles', { name: 'editors' })).status).toBe(409);
    const id = created.body.data.id as string;
    expect((await c.patch(`/api/roles/${id}`, { description: 'Updated' })).body.data.description).toBe('Updated');
    expect((await c.put(`/api/roles/${id}/permissions`, { permissionIds: await permIds(['users:read']) })).body.data.permissions).toHaveLength(1);
    expect((await c.put(`/api/roles/${id}/permissions`, { permissionIds: [UUID] })).status).toBe(400);
    expect((await c.del(`/api/roles/${id}`)).status).toBe(200);
    expect((await c.del(`/api/roles/${id}`)).status).toBe(404);
  });

  it('system roles (admin, user) are immutable: no rename, delete, or permission change', async () => {
    await createUser({ email: 'root@example.com', roles: ['admin'] });
    const c = await loginAs('root@example.com');
    for (const name of ['admin', 'user']) {
      const id = await roleId(name);
      expect((await c.patch(`/api/roles/${id}`, { name: 'renamed' })).status).toBe(403);
      expect((await c.del(`/api/roles/${id}`)).status).toBe(403);
      expect((await c.put(`/api/roles/${id}/permissions`, { permissionIds: [] })).status).toBe(403);
    }
    const list = (await c.get('/api/roles')).body.data as { name: string; permissions: unknown[] }[];
    expect(list.find((r) => r.name === 'admin')?.permissions).toHaveLength(PERMISSION_KEYS.length);
  });

  it('a role manager cannot hand out permissions they do not hold', async () => {
    await createUser({ email: 'root@example.com', roles: ['admin'] });
    const admin = await loginAs('root@example.com');
    const mgrRole = await customRole(admin, 'role-manager', ['roles:read', 'roles:write']);
    const mgrUser = await createUser({ email: 'mgr@example.com', roles: [] });
    await admin.put(`/api/users/${mgrUser.id}/roles`, { roleIds: [mgrRole] });
    const mgr = await loginAs('mgr@example.com');
    const created = await mgr.post('/api/roles', { name: 'sneaky' });
    const res = await mgr.put(`/api/roles/${created.body.data.id}/permissions`, { permissionIds: await permIds(['users:delete']) });
    expect(res.status).toBe(403);
  });
});

describe('seeding', () => {
  it('is idempotent and never overwrites an existing admin', async () => {
    const before = await rowCounts();
    await seedRolesAndPermissions();
    await seedRolesAndPermissions();
    expect(await rowCounts()).toEqual(before);
    expect(await seedAdminUser('root@example.com', PASSWORD)).toBe('created');
    expect(await seedAdminUser('root@example.com', 'a-different-password-9')).toBe('exists');
    expect((await makeClient().post('/api/auth/login', { email: 'root@example.com', password: PASSWORD })).status).toBe(200);
  });

  it('the seed script aborts (exit 1) without SEED_ADMIN_* and has no default credentials', () => {
    const env = { ...process.env };
    delete env.SEED_ADMIN_EMAIL;
    delete env.SEED_ADMIN_PASSWORD;
    const tsx = resolve(__dirname, '../../../node_modules/tsx/dist/cli.mjs');
    const res = spawnSync(process.execPath, [tsx, 'src/scripts/seed.ts'], { cwd: resolve(__dirname, '../..'), env, encoding: 'utf8' });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/SEED_ADMIN_EMAIL/);
  });
});
