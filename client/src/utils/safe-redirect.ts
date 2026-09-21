const ORIGIN = 'http://redirect-check.invalid';
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/**
 * Open-redirect protection for `?next=`: only same-origin relative paths are accepted.
 * Anything else (absolute URLs, protocol-relative `//host`, backslash tricks, control
 * characters, login loops) falls back to `fallback`.
 */
export function safeNextPath(next: unknown, fallback = '/'): string {
  const value = Array.isArray(next) ? next[0] : next;
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\') || CONTROL_CHARS.test(value)) return fallback;
  try {
    const url = new URL(value, ORIGIN);
    if (url.origin !== ORIGIN) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (url.pathname === '/login' || url.pathname === '/register') return fallback;
    return path;
  } catch {
    return fallback;
  }
}

export function loginUrlFor(currentPath: string): string {
  const next = safeNextPath(currentPath, '/');
  return next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`;
}
