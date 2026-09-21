import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../interfaces/api-error';
import { createHttpClient } from './http-client';

interface Reply {
  status: number;
  body: unknown;
}
type Handler = (config: InternalAxiosRequestConfig, callIndex: number) => Reply | Promise<Reply>;

function ok<T>(data: T): Reply {
  return { status: 200, body: { success: true, message: 'ok', data } };
}
function fail(status: number, message = 'nope', errors?: { field: string; issue: string }[]): Reply {
  return { status, body: { success: false, message, ...(errors ? { errors } : {}) } };
}

function setup(handler: Handler) {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const reply = await handler(config, calls.length - 1);
    const response: AxiosResponse = { data: reply.body, status: reply.status, statusText: '', headers: {}, config };
    if (reply.status >= 200 && reply.status < 300) return response;
    throw new AxiosError('failed', String(reply.status), config, null, response);
  };
  const onAuthFailure = vi.fn();
  const client = createHttpClient({ baseURL: '', adapter, onAuthFailure });
  const count = (url: string): number => calls.filter((c) => c.url === url).length;
  return { ...client, calls, count, onAuthFailure };
}

describe('http client', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends credentials and unwraps the envelope once', async () => {
    const { instance, calls } = setup(() => ok({ hello: 'world' }));
    const res = await instance.get<{ hello: string }>('/api/things');
    expect(res.data).toEqual({ hello: 'world' });
    expect(calls[0]?.withCredentials).toBe(true);
  });

  it('turns a failure envelope into ApiError with field errors', async () => {
    const { instance } = setup(() => fail(400, 'Invalid', [{ field: 'email', issue: 'bad' }]));
    const error = await instance.get('/api/things').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'Invalid', status: 400, errors: [{ field: 'email', issue: 'bad' }] });
  });

  it('fetches the CSRF token once and sends X-CSRF-Token on unsafe methods only', async () => {
    const { instance, calls, count } = setup((c) => (c.url === '/api/auth/csrf' ? ok({ csrfToken: 'tok-1' }) : ok({})));
    await instance.get('/api/users');
    expect(count('/api/auth/csrf')).toBe(0);
    await instance.post('/api/roles', { name: 'x' });
    await instance.delete('/api/roles/1');
    expect(count('/api/auth/csrf')).toBe(1);
    const post = calls.find((c) => c.method === 'post');
    const del = calls.find((c) => c.method === 'delete');
    expect(post?.headers.get('X-CSRF-Token')).toBe('tok-1');
    expect(del?.headers.get('X-CSRF-Token')).toBe('tok-1');
    expect(calls.find((c) => c.method === 'get' && c.url === '/api/users')?.headers.get('X-CSRF-Token')).toBeFalsy();
  });

  it('refetches the CSRF token after login (session-bound)', async () => {
    let n = 0;
    const { instance, count } = setup((c) => (c.url === '/api/auth/csrf' ? ok({ csrfToken: `t${++n}` }) : ok({})));
    await instance.post('/api/auth/login', {});
    await instance.post('/api/roles', {});
    expect(count('/api/auth/csrf')).toBe(2);
  });

  it('on 401 refreshes once and retries the original request once', async () => {
    let usersCalls = 0;
    const { instance, count } = setup((c) => {
      if (c.url === '/api/auth/csrf') return ok({ csrfToken: 't' });
      if (c.url === '/api/auth/refresh') return ok({});
      usersCalls += 1;
      return usersCalls === 1 ? fail(401, 'expired') : ok({ items: [] });
    });
    const res = await instance.get('/api/users');
    expect(res.data).toEqual({ items: [] });
    expect(count('/api/auth/refresh')).toBe(1);
    expect(usersCalls).toBe(2);
  });

  it('single-flights refresh for parallel 401s', async () => {
    const seen = new Set<string>();
    const { instance, count } = setup(async (c) => {
      if (c.url === '/api/auth/csrf') return ok({ csrfToken: 't' });
      if (c.url === '/api/auth/refresh') {
        await new Promise((r) => setTimeout(r, 10));
        return ok({});
      }
      const key = c.url ?? '';
      if (!seen.has(key)) {
        seen.add(key);
        return fail(401);
      }
      return ok({ url: key });
    });
    const results = await Promise.all([instance.get('/api/a'), instance.get('/api/b'), instance.get('/api/c')]);
    expect(results.map((r) => r.data)).toEqual([{ url: '/api/a' }, { url: '/api/b' }, { url: '/api/c' }]);
    expect(count('/api/auth/refresh')).toBe(1);
  });

  it('never loops: a second 401 after a successful refresh is surfaced', async () => {
    const { instance, count, onAuthFailure } = setup((c) => {
      if (c.url === '/api/auth/csrf') return ok({ csrfToken: 't' });
      if (c.url === '/api/auth/refresh') return ok({});
      return fail(401, 'still no');
    });
    await expect(instance.get('/api/users')).rejects.toMatchObject({ status: 401 });
    expect(count('/api/auth/refresh')).toBe(1);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it('clears auth state (onAuthFailure) when refresh fails', async () => {
    const { instance, onAuthFailure } = setup((c) => {
      if (c.url === '/api/auth/csrf') return ok({ csrfToken: 't' });
      return fail(401, 'gone');
    });
    await expect(instance.get('/api/users')).rejects.toBeInstanceOf(ApiError);
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it('does not attempt refresh for a failed login', async () => {
    const { instance, count, onAuthFailure } = setup((c) => {
      if (c.url === '/api/auth/csrf') return ok({ csrfToken: 't' });
      return fail(401, 'Invalid credentials');
    });
    await expect(instance.post('/api/auth/login', {})).rejects.toMatchObject({ message: 'Invalid credentials', status: 401 });
    expect(count('/api/auth/refresh')).toBe(0);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });
});
