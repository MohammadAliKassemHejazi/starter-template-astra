import { describe, expect, it } from 'vitest';
import { loginUrlFor, safeNextPath } from './safe-redirect';

describe('safeNextPath (open-redirect protection)', () => {
  it('accepts same-origin relative paths with query and hash', () => {
    expect(safeNextPath('/admin/users')).toBe('/admin/users');
    expect(safeNextPath('/admin/users?page=2#top')).toBe('/admin/users?page=2#top');
  });

  it.each([
    'https://evil.com',
    'http://evil.com/x',
    '//evil.com',
    '///evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    'javascript:alert(1)',
    'evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '',
    '/login',
    '/register?x=1',
  ])('rejects %j', (input) => {
    expect(safeNextPath(input)).toBe('/');
  });

  it('rejects non-strings and uses first array value', () => {
    expect(safeNextPath(undefined)).toBe('/');
    expect(safeNextPath(42)).toBe('/');
    expect(safeNextPath(['/a', 'https://evil.com'])).toBe('/a');
    expect(safeNextPath('nope', '/home')).toBe('/home');
  });

  it('builds a login url with an encoded next only for safe paths', () => {
    expect(loginUrlFor('/admin/users?page=2')).toBe('/login?next=%2Fadmin%2Fusers%3Fpage%3D2');
    expect(loginUrlFor('//evil.com')).toBe('/login');
    expect(loginUrlFor('/')).toBe('/login');
  });
});
