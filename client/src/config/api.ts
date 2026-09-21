export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
export const CSRF_HEADER = 'X-CSRF-Token';
export const AUTH_PATHS = {
  csrf: '/api/auth/csrf',
  refresh: '/api/auth/refresh',
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
} as const;
