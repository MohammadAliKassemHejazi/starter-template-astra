import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Permission } from '@project/shared';
import { Can } from '../common/Can';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/auth-slice';

export function AppShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  const onLogout = async (): Promise<void> => {
    await dispatch(logout());
    await router.replace('/login');
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-white focus:p-2">
        Skip to content
      </a>
      <header className="border-b border-slate-300 bg-white">
        <nav aria-label="Main" className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/" className="font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">
            Home
          </Link>
          <Can permission={Permission.UsersRead}>
            <Link href="/admin/users" className="text-indigo-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">
              Users
            </Link>
          </Can>
          <Can permission={Permission.RolesRead}>
            <Link href="/admin/roles" className="text-indigo-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700">
              Roles
            </Link>
          </Can>
          <span className="ml-auto flex items-center gap-3 text-sm text-slate-800">
            {user ? (
              <>
                <span>{user.name}</span>
                <button type="button" className="btn-secondary" onClick={() => void onLogout()}>
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="text-indigo-800 underline">
                Sign in
              </Link>
            )}
          </span>
        </nav>
      </header>
      <div id="main">{children}</div>
    </>
  );
}
