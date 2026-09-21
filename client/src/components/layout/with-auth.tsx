import type { ComponentType } from 'react';
import type { Permission } from '@project/shared';
import { useRequireAuth } from '../../hooks/use-require-auth';

/** HOC applying the UX route guard; renders nothing but a status line until access is decided. */
export function withAuth<P extends object>(Component: ComponentType<P>, permission?: Permission) {
  function Guarded(props: P) {
    const state = useRequireAuth(permission);
    if (state !== 'allowed') {
      return (
        <main id="main" tabIndex={-1}>
          <p role="status" className="p-8 text-slate-700">
            {state === 'loading' ? 'Checking your session…' : 'Redirecting…'}
          </p>
        </main>
      );
    }
    return <Component {...props} />;
  }
  Guarded.displayName = `withAuth(${Component.displayName ?? Component.name ?? 'Component'})`;
  return Guarded;
}
