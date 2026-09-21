import type { AuthSessionDto } from '@project/shared';
import { Permission } from '@project/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../interfaces/api-error';
import * as authService from '../../services/auth-service';
import { makeStore } from '../index';
import { fetchMe, login, logout, register, sessionExpired } from './auth-slice';

vi.mock('../../services/auth-service');
const svc = vi.mocked(authService);

const session: AuthSessionDto = {
  user: { id: 'u1', email: 'a@b.co', name: 'Ann', isActive: true, lastLoginAt: null, createdAt: '2026-01-01', roles: [] },
  permissions: [Permission.UsersRead],
};
const creds = { email: 'a@b.co', password: 'secret-password' };

describe('auth slice', () => {
  beforeEach(() => vi.resetAllMocks());

  it('starts idle and anonymous', () => {
    expect(makeStore().getState().auth).toMatchObject({ status: 'idle', user: null, permissions: [] });
  });

  it('login: pending then fulfilled stores user and permissions (no tokens)', async () => {
    svc.loginRequest.mockResolvedValue(session);
    const store = makeStore();
    const p = store.dispatch(login(creds));
    expect(store.getState().auth.status).toBe('loading');
    await p;
    expect(store.getState().auth).toEqual({ status: 'authenticated', user: session.user, permissions: session.permissions, error: null });
  });

  it('login rejected surfaces the server message and stays anonymous', async () => {
    svc.loginRequest.mockRejectedValue(new ApiError('Invalid credentials', 401));
    const store = makeStore();
    await store.dispatch(login(creds));
    expect(store.getState().auth).toMatchObject({ status: 'anonymous', error: 'Invalid credentials', user: null });
  });

  it('fetchMe fulfilled/rejected', async () => {
    svc.fetchMeRequest.mockResolvedValueOnce(session);
    const store = makeStore();
    await store.dispatch(fetchMe());
    expect(store.getState().auth.status).toBe('authenticated');
    svc.fetchMeRequest.mockRejectedValueOnce(new ApiError('Unauthorized', 401));
    await store.dispatch(fetchMe());
    expect(store.getState().auth).toMatchObject({ status: 'anonymous', user: null, permissions: [] });
  });

  it('register rejected exposes status for registration-disabled handling', async () => {
    svc.registerRequest.mockRejectedValue(new ApiError('Registration disabled', 403));
    const store = makeStore();
    const result = await store.dispatch(register({ email: 'a@b.co', password: 'x'.repeat(12), name: 'A' }));
    expect(register.rejected.match(result) && result.payload?.status).toBe(403);
    expect(store.getState().auth.error).toBe('Registration disabled');
  });

  it('logout resets state even when the request fails', async () => {
    svc.loginRequest.mockResolvedValue(session);
    svc.logoutRequest.mockRejectedValue(new ApiError('boom', 500));
    const store = makeStore();
    await store.dispatch(login(creds));
    await store.dispatch(logout());
    expect(store.getState().auth).toEqual({ status: 'anonymous', user: null, permissions: [], error: null });
  });

  it('sessionExpired (refresh failure) clears auth state', async () => {
    svc.loginRequest.mockResolvedValue(session);
    const store = makeStore();
    await store.dispatch(login(creds));
    store.dispatch(sessionExpired());
    expect(store.getState().auth).toMatchObject({ status: 'anonymous', user: null, permissions: [] });
  });
});
