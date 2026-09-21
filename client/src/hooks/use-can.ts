import type { Permission } from '@project/shared';
import { useAppSelector } from '../store';

/** UX-only permission check; the server remains the authority. */
export function useCan(permission: Permission): boolean {
  return useAppSelector((s) => s.auth.status === 'authenticated' && s.auth.permissions.includes(permission));
}
