import type { ReactNode } from 'react';
import type { Permission } from '@project/shared';
import { useCan } from '../../hooks/use-can';

interface CanProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  return <>{useCan(permission) ? children : fallback}</>;
}
