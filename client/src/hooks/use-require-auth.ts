import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { Permission } from '@project/shared';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchMe } from '../store/slices/auth-slice';
import { loginUrlFor } from '../utils/safe-redirect';

export type GuardState = 'loading' | 'allowed' | 'redirecting' | 'forbidden';

/**
 * UX-only route guard. Anonymous users go to /login?next=<safe path>; users lacking the
 * permission are sent to /403. Every API call is still authorized by the server.
 */
export function useRequireAuth(permission?: Permission): GuardState {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const permissions = useAppSelector((s) => s.auth.permissions);

  useEffect(() => {
    if (status === 'idle') void dispatch(fetchMe());
  }, [status, dispatch]);

  const isForbidden = status === 'authenticated' && permission !== undefined && !permissions.includes(permission);

  useEffect(() => {
    if (status === 'anonymous') void router.replace(loginUrlFor(router.asPath));
    else if (isForbidden) void router.replace('/403');
  }, [status, isForbidden, router]);

  if (status === 'idle' || status === 'loading') return 'loading';
  if (status === 'anonymous') return 'redirecting';
  return isForbidden ? 'forbidden' : 'allowed';
}
