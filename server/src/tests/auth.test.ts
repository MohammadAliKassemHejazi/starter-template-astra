import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { config, loadConfig } from '../config';
import { sequelize } from '../db/sequelize';
import { ipKey } from '../middlewares/rateLimit';
import { revokeAllForUser } from '../services/token.service';
import { COOKIE_NAMES, cookieNamesFor } from '../utils/cookies';
import { cookieFrom, createUser, loginAs, makeClient, ORIGIN, PASSWORD, setCookieLines } from './helpers';

const EMAIL = 'alice@example.com';
const validRegister = { email: 'New.User@Example.com ', password: PASSWORD, name: 'New User' };

async function refreshRows(): Promise<{ token_hash: string; family_id: string; revoked_at: Date | null; used_at: Date | null }[]> {
  return sequelize.query('SELECT token_hash, family_id, revoked_at, used_at FROM refresh_tokens ORDER BY created_at', {
    type: QueryTypes.SELECT,
  });
}

describe('csrf + origin', () => {
  it('issues {csrfToken}, sets a readable cookie, and forbids caching', async () => {
    const c = makeClient();
    const res = await c.get('/api/auth/csrf');
    expect(res.status).toBe(200);
    expect(res.body.data.csrfToken).toMatch(/^[0-9a-f]{32}\.[0-9a-f]{64}$/);
    expect(res.headers['cache-control']).toBe('no-store');
    const line = setCookieLines(res).find((l) => l.startsWith(`${COOKIE_NAMES.csrf}=`)) ?? '';
    expect(line).not.toMatch(/HttpOnly/i);
    expect(line).toMatch(/SameSite=Strict/i);
  });

  it.each(['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout'])(
    '%s without a CSRF token -> 403',
    async (path) => {
      const res = await request(createApp()).post(path).set('Origin', ORIGIN).send({});
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    },
  );

  it('wrong or missing Origin -> 403 even with a valid token', async () => {
    const c = makeClient();
    const token = await c.csrf();
    const bad = await c.agent.post('/api/auth/login').set('Origin', 'https://evil.example').set('X-CSRF-Token', token).send({});
    expect(bad.status).toBe(403);
    const none = await c.agent.post('/api/auth/login').set('X-CSRF-Token', token).send({});
    expect(none.status).toBe(403);
  });

  it('header must match the cookie and be bound to the session', async () => {
    const c = makeClient();
    const token = await c.csrf();
    const other = await makeClient().csrf(); // valid HMAC for "anon", but not the cookie value
    const res = await c.agent.post('/api/auth/login').set('Origin', ORIGIN).set('X-CSRF-Token', other).send({});
    expect(res.status).toBe(403);
    // a token issued to an anonymous visitor cannot be replayed inside an authenticated session
    await createUser({ email: EMAIL });
    const anonToken = token;
    const logged = await loginAs(EMAIL);
    const replay = await logged.agent.post('/api/auth/logout').set('Origin', ORIGIN).set('X-CSRF-Token', anonToken).send({});
    expect(replay.status).toBe(403);
  });

  it('cookie names carry __Host-/__Secure- prefixes when Secure', () => {
    expect(cookieNamesFor(true)).toEqual({
      access: '__Host-access_token',
      refresh: '__Secure-refresh_token',
      csrf: '__Host-csrf_token',
    });
    expect(cookieNamesFor(false).access).toBe('access_token');
  });
});

describe('POST /api/auth/register', () => {
  it('returns the UserDto, does NOT log in, normalises email, assigns the user role', async () => {
    const c = makeClient();
    const res = await c.post('/api/auth/register', validRegister);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: 'new.user@example.com', name: 'New User', isActive: true });
    expect(res.body.data.roles.map((r: { name: string }) => r.name)).toEqual(['user']);
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);
    expect(setCookieLines(res).some((l) => l.startsWith(COOKIE_NAMES.access))).toBe(false);
    expect((await c.get('/api/auth/me')).status).toBe(401);
  });

  it('stores an argon2id hash', async () => {
    await makeClient().post('/api/auth/register', validRegister);
    const rows = await sequelize.query<{ password_hash: string }>('SELECT password_hash FROM users', { type: QueryTypes.SELECT });
    expect(rows[0]?.password_hash.startsWith('$argon2id$')).toBe(true);
  });

  it('rejects mass assignment (roles / isActive) and weak or oversized passwords', async () => {
    const c = makeClient();
    expect((await c.post('/api/auth/register', { ...validRegister, roles: ['admin'] })).status).toBe(400);
    expect((await c.post('/api/auth/register', { ...validRegister, isActive: false })).status).toBe(400);
    expect((await c.post('/api/auth/register', { ...validRegister, password: 'short' })).status).toBe(400);
    expect((await c.post('/api/auth/register', { ...validRegister, password: 'x'.repeat(129) })).status).toBe(400);
  });

  it('409 on duplicate email (accepted enumeration trade-off, see README)', async () => {
    const c = makeClient();
    expect((await c.post('/api/auth/register', validRegister)).status).toBe(201);
    expect((await c.post('/api/auth/register', { ...validRegister, email: 'NEW.user@example.com' })).status).toBe(409);
  });

  it('403 when ALLOW_REGISTRATION is off', async () => {
    config.allowRegistration = false;
    try {
      const res = await makeClient().post('/api/auth/register', validRegister);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/disabled/i);
    } finally {
      config.allowRegistration = true;
    }
  });
});

describe('POST /api/auth/login', () => {
  it('logs in, sets hardened cookies, returns session with permissions', async () => {
    await createUser({ email: EMAIL, roles: ['admin'] });
    const c = makeClient();
    const res = await c.post('/api/auth/login', { email: ' ALICE@example.com', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(EMAIL);
    expect(res.body.data.permissions).toContain('roles:write');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);
    const lines = setCookieLines(res);
    const access = lines.find((l) => l.startsWith(`${COOKIE_NAMES.access}=`)) ?? '';
    const refresh = lines.find((l) => l.startsWith(`${COOKIE_NAMES.refresh}=`)) ?? '';
    for (const l of [access, refresh]) {
      expect(l).toMatch(/HttpOnly/i);
      expect(l).toMatch(/SameSite=Strict/i);
    }
    expect(refresh).toMatch(/Path=\/api\/auth/);
    expect(access).toMatch(/Path=\/;/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect((await c.get('/api/auth/me')).body.data.user.email).toBe(EMAIL);
  });

  it('DB holds only the SHA-256 of the refresh token', async () => {
    await createUser({ email: EMAIL });
    const res = await makeClient().post('/api/auth/login', { email: EMAIL, password: PASSWORD });
    const raw = cookieFrom(res, COOKIE_NAMES.refresh) ?? '';
    const rows = await refreshRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.token_hash).toBe(createHash('sha256').update(raw).digest('hex'));
    expect(rows[0]?.token_hash).not.toBe(raw);
  });

  it('unknown user, wrong password and inactive user are indistinguishable', async () => {
    await createUser({ email: EMAIL });
    await createUser({ email: 'off@example.com', active: false });
    const wrong = await makeClient().post('/api/auth/login', { email: EMAIL, password: 'not-the-password' });
    const unknown = await makeClient().post('/api/auth/login', { email: 'ghost@example.com', password: PASSWORD });
    const inactive = await makeClient().post('/api/auth/login', { email: 'off@example.com', password: PASSWORD });
    for (const r of [wrong, unknown, inactive]) expect(r.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(inactive.body).toEqual(wrong.body);
    expect(setCookieLines(inactive).some((l) => l.startsWith(COOKIE_NAMES.access))).toBe(false);
  });

  it('login limiter counts IP+email failures: N+1th -> 429; other emails unaffected', async () => {
    const app = createApp({ rateLimit: { generalMax: 1000, authMax: 1000, loginMax: 2, windowMs: 60_000 } });
    const c = makeClient(app);
    const bad = { email: 'victim@example.com', password: 'wrong-password-1' };
    expect((await c.post('/api/auth/login', bad)).status).toBe(401);
    expect((await c.post('/api/auth/login', bad)).status).toBe(401);
    expect((await c.post('/api/auth/login', { ...bad, email: ' VICTIM@example.com' })).status).toBe(429);
    expect((await c.post('/api/auth/login', { ...bad, email: 'other@example.com' })).status).toBe(401);
  });

  it('per-IP auth limiter applies before anything else', async () => {
    const app = createApp({ rateLimit: { generalMax: 1000, authMax: 3, loginMax: 1000, windowMs: 60_000 } });
    const c = makeClient(app);
    const statuses: number[] = [];
    // CSRF-less posts are rejected (403) but still counted: the limiter runs before CSRF and hashing.
    for (let i = 0; i < 4; i++) statuses.push((await c.agent.post('/api/auth/refresh').set('Origin', ORIGIN).send({})).status);
    expect(statuses).toEqual([403, 403, 403, 429]);
    expect((await c.get('/api/auth/csrf')).status).toBe(200); // token endpoint is not counted
  });
});

describe('access token verification', () => {
  const sign = (payload: object, opts: jwt.SignOptions, secret = config.jwtSecret): string => jwt.sign(payload, secret, opts);
  const me = (token: string) => request(createApp()).get('/api/auth/me').set('Cookie', `${COOKIE_NAMES.access}=${token}`);

  it('rejects alg=none, wrong secret, expired, and no-exp tokens', async () => {
    const user = await createUser({ email: EMAIL });
    await loginAs(EMAIL);
    const [row] = await refreshRows();
    const claims = { fid: row?.family_id ?? '' };
    const b64 = (o: object): string => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ ...claims, sub: user.id, exp: Math.floor(Date.now() / 1000) + 600 })}.`;
    expect((await me(none)).status).toBe(401);
    expect((await me(sign(claims, { algorithm: 'HS256', subject: user.id, expiresIn: '5m' }, 'x'.repeat(40)))).status).toBe(401);
    expect((await me(sign(claims, { algorithm: 'HS256', subject: user.id, expiresIn: -10 }))).status).toBe(401);
    expect((await me(sign(claims, { algorithm: 'HS256', subject: user.id }))).status).toBe(401);
    // control: the same claims, correctly signed, are accepted
    expect((await me(sign(claims, { algorithm: 'HS256', subject: user.id, expiresIn: '5m' }))).status).toBe(200);
  });

  it('rejects a family id that does not belong to the subject, and ignores Authorization headers', async () => {
    const alice = await createUser({ email: EMAIL });
    const bob = await createUser({ email: 'bob@example.com' });
    await loginAs(EMAIL);
    const [row] = await refreshRows();
    const stolen = sign({ fid: row?.family_id }, { algorithm: 'HS256', subject: bob.id, expiresIn: '5m' });
    expect((await me(stolen)).status).toBe(401);
    const bearer = sign({ fid: row?.family_id }, { algorithm: 'HS256', subject: alice.id, expiresIn: '5m' });
    expect((await request(createApp()).get('/api/auth/me').set('Authorization', `Bearer ${bearer}`)).status).toBe(401);
  });

  it('a deactivated user loses access immediately and cannot refresh', async () => {
    const user = await createUser({ email: EMAIL });
    const c = await loginAs(EMAIL);
    expect((await c.get('/api/auth/me')).status).toBe(200);
    await user.update({ isActive: false });
    expect((await c.get('/api/auth/me')).status).toBe(401);
    expect((await c.post('/api/auth/refresh')).status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotates the token and keeps the session working', async () => {
    await createUser({ email: EMAIL });
    const c = await loginAs(EMAIL);
    const before = await refreshRows();
    const res = await c.post('/api/auth/refresh');
    expect(res.status).toBe(200);
    const after = await refreshRows();
    expect(after).toHaveLength(2);
    expect(after[0]?.used_at).not.toBeNull();
    expect(after[1]?.family_id).toBe(before[0]?.family_id);
    expect((await c.get('/api/auth/me')).status).toBe(200);
  });

  it('reusing a rotated token -> 401 and the whole family is revoked', async () => {
    await createUser({ email: EMAIL });
    const first = makeClient();
    const login = await first.post('/api/auth/login', { email: EMAIL, password: PASSWORD });
    const oldRefresh = cookieFrom(login, COOKIE_NAMES.refresh) ?? '';
    expect((await first.post('/api/auth/refresh')).status).toBe(200);

    // attacker replays the OLD token
    const attacker = makeClient();
    const token = await attacker.csrf();
    const replay = await request(createApp())
      .post('/api/auth/refresh')
      .set('Origin', ORIGIN)
      .set('X-CSRF-Token', token)
      .set('Cookie', `${COOKIE_NAMES.refresh}=${oldRefresh}; ${COOKIE_NAMES.csrf}=${token}`)
      .send({});
    expect(replay.status).toBe(401);

    const rows = await refreshRows();
    expect(rows.every((r) => r.revoked_at !== null)).toBe(true);
    // the legitimate holder of the newest token is cut off too
    expect((await first.post('/api/auth/refresh')).status).toBe(401);
    expect((await first.get('/api/auth/me')).status).toBe(401);
  });

  it('concurrent refreshes with one token: exactly one wins', async () => {
    await createUser({ email: EMAIL });
    const c = await loginAs(EMAIL);
    const token = await c.csrf();
    const fire = () => c.agent.post('/api/auth/refresh').set('Origin', ORIGIN).set('X-CSRF-Token', token).send({});
    const results = await Promise.all([fire(), fire()]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 401]);
  });

  it('enforces the absolute family lifetime', async () => {
    await createUser({ email: EMAIL });
    const c = await loginAs(EMAIL);
    await sequelize.query("UPDATE refresh_tokens SET family_expires_at = now() - interval '1 minute'");
    expect((await c.post('/api/auth/refresh')).status).toBe(401);
  });

  it('a refresh racing a password change cannot mint a surviving session', async () => {
    const user = await createUser({ email: EMAIL });
    const c = await loginAs(EMAIL);
    const lock = await sequelize.transaction();
    await sequelize.query('SELECT id FROM users WHERE id = :id FOR UPDATE', { replacements: { id: user.id }, transaction: lock });
    const pending = c.post('/api/auth/refresh'); // must wait for the user-row lock
    await new Promise((r) => setTimeout(r, 400));
    await revokeAllForUser(user.id, lock);
    await lock.commit();
    expect((await pending).status).toBe(401);
    expect((await refreshRows()).every((r) => r.revoked_at !== null)).toBe(true);
  });

  it('401 and cleared cookies without a refresh cookie', async () => {
    const res = await makeClient().post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(setCookieLines(res).filter((l) => /Expires=Thu, 01 Jan 1970/i.test(l))).toHaveLength(3);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the family, clears all three cookies, and kills the access token', async () => {
    await createUser({ email: EMAIL });
    const c = await loginAs(EMAIL);
    const res = await c.post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cleared = setCookieLines(res).filter((l) => /Expires=Thu, 01 Jan 1970/i.test(l));
    expect(cleared.map((l) => l.split('=')[0]).sort()).toEqual(
      [COOKIE_NAMES.access, COOKIE_NAMES.csrf, COOKIE_NAMES.refresh].sort(),
    );
    expect((await refreshRows()).every((r) => r.revoked_at !== null)).toBe(true);
    expect((await c.get('/api/auth/me')).status).toBe(401);
  });

  it('works from the refresh cookie alone (expired/absent access cookie) and is idempotent', async () => {
    await createUser({ email: EMAIL });
    const login = await makeClient().post('/api/auth/login', { email: EMAIL, password: PASSWORD });
    const refresh = cookieFrom(login, COOKIE_NAMES.refresh) ?? '';
    const token = await makeClient().csrf();
    const out = () =>
      request(createApp())
        .post('/api/auth/logout')
        .set('Origin', ORIGIN)
        .set('X-CSRF-Token', token)
        .set('Cookie', `${COOKIE_NAMES.refresh}=${refresh}; ${COOKIE_NAMES.csrf}=${token}`)
        .send({});
    expect((await out()).status).toBe(200);
    expect((await refreshRows()).every((r) => r.revoked_at !== null)).toBe(true);
    expect((await out()).status).toBe(200);
    expect((await makeClient().post('/api/auth/logout')).status).toBe(200);
  });
});

describe('boot-time configuration', () => {
  const base = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgres://u:p@localhost:5432/x',
    JWT_ACCESS_SECRET: 'a'.repeat(40),
    CLIENT_ORIGIN: 'http://localhost:3000',
  };
  it('accepts a valid environment', () => {
    expect(loadConfig({ ...base }).clientOrigin).toBe('http://localhost:3000');
  });
  it('requires NODE_ENV to be set explicitly', () => {
    const { NODE_ENV: _omit, ...rest } = base;
    void _omit;
    expect(() => loadConfig(rest)).toThrow(/NODE_ENV/);
  });
  it('fails on a weak JWT secret', () => {
    expect(() => loadConfig({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/);
  });
  it.each(['*', 'http://a.example,http://b.example', 'http://localhost:3000/', 'not a url'])('rejects CLIENT_ORIGIN=%s', (origin) => {
    expect(() => loadConfig({ ...base, CLIENT_ORIGIN: origin })).toThrow(/CLIENT_ORIGIN/);
  });
  it('requires an explicit, non-"true" TRUST_PROXY in production', () => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production' })).toThrow(/TRUST_PROXY/);
    expect(() => loadConfig({ ...base, NODE_ENV: 'production', TRUST_PROXY: 'true' })).toThrow(/TRUST_PROXY/);
    expect(loadConfig({ ...base, NODE_ENV: 'production', TRUST_PROXY: '1' }).trustProxy).toBe(1);
  });
});

describe('rate-limit keys', () => {
  it('collapses IPv6 to its /64 and unwraps mapped IPv4', () => {
    expect(ipKey('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe(ipKey('2001:db8:1:2:1::9'));
    expect(ipKey('2001:db8:1:3::1')).not.toBe(ipKey('2001:db8:1:2::1'));
    expect(ipKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(ipKey('203.0.113.7')).toBe('203.0.113.7');
  });
});
