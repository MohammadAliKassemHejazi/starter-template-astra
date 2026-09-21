import type { Express } from 'express';
import request from 'supertest';

import { config } from '../config';
import { createApp } from '../app';
import { Role, User, UserRole } from '../models';
import { hashPassword } from '../utils/password';

export const ORIGIN = config.clientOrigin;
export const PASSWORD = 'correct-horse-battery-1';

export interface Client {
  agent: ReturnType<typeof request.agent>;
  /** Fetches a fresh CSRF token (bound to the current session) and sends the request. */
  post: (path: string, body?: object) => Promise<request.Response>;
  patch: (path: string, body?: object) => Promise<request.Response>;
  put: (path: string, body?: object) => Promise<request.Response>;
  del: (path: string) => Promise<request.Response>;
  get: (path: string) => Promise<request.Response>;
  csrf: () => Promise<string>;
}

export function makeClient(app: Express = createApp()): Client {
  const agent = request.agent(app);
  const csrf = async (): Promise<string> => {
    const res = await agent.get('/api/auth/csrf');
    return (res.body as { data: { csrfToken: string } }).data.csrfToken;
  };
  const withCsrf = async (req: (t: string) => request.Test): Promise<request.Response> => req(await csrf());
  return {
    agent,
    csrf,
    get: (path) => Promise.resolve(agent.get(path)),
    post: (path, body) => withCsrf((t) => agent.post(path).set('Origin', ORIGIN).set('X-CSRF-Token', t).send(body ?? {})),
    patch: (path, body) => withCsrf((t) => agent.patch(path).set('Origin', ORIGIN).set('X-CSRF-Token', t).send(body ?? {})),
    put: (path, body) => withCsrf((t) => agent.put(path).set('Origin', ORIGIN).set('X-CSRF-Token', t).send(body ?? {})),
    del: (path) => withCsrf((t) => agent.delete(path).set('Origin', ORIGIN).set('X-CSRF-Token', t)),
  };
}

export async function createUser(opts: { email: string; roles?: string[]; active?: boolean; password?: string; name?: string }): Promise<User> {
  const user = await User.create({
    email: opts.email,
    passwordHash: await hashPassword(opts.password ?? PASSWORD),
    name: opts.name ?? 'Test User',
    isActive: opts.active ?? true,
  });
  for (const name of opts.roles ?? ['user']) {
    const role = await Role.findOne({ where: { name } });
    if (role) await UserRole.create({ userId: user.id, roleId: role.id });
  }
  return user;
}

export async function loginAs(email: string, password: string = PASSWORD, app?: Express): Promise<Client> {
  const c = makeClient(app);
  const res = await c.post('/api/auth/login', { email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return c;
}

/** Extracts a cookie value (or the whole Set-Cookie line when `raw`) from a response. */
export function cookieFrom(res: request.Response, name: string): string | undefined {
  const list = (res.headers['set-cookie'] ?? []) as unknown as string[];
  const line = list.find((c) => c.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).split(';')[0] : undefined;
}

export function setCookieLines(res: request.Response): string[] {
  return (res.headers['set-cookie'] ?? []) as unknown as string[];
}
