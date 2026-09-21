import { screen, waitFor } from '@testing-library/react';
import { Permission } from '@project/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithStore } from '../../utils/render-with-store';
import { withAuth } from './with-auth';

const replace = vi.fn();
let asPath = '/admin/users?page=2';
vi.mock('next/router', () => ({ useRouter: () => ({ replace, asPath, query: {} }) }));
vi.mock('../../services/auth-service', () => ({
  fetchMeRequest: vi.fn(() => new Promise(() => undefined)),
}));

const Secret = withAuth(() => <p>secret</p>, Permission.UsersRead);

describe('withAuth route guard', () => {
  beforeEach(() => {
    replace.mockReset();
    asPath = '/admin/users?page=2';
  });

  it('shows a status while the session is being resolved and does not leak content', () => {
    renderWithStore(<Secret />, { status: 'loading' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects anonymous users to /login with an encoded relative next', async () => {
    renderWithStore(<Secret />, { status: 'anonymous' });
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?next=%2Fadmin%2Fusers%3Fpage%3D2'));
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('drops an unsafe current path instead of forwarding it as next (open redirect)', async () => {
    asPath = '//evil.com/phish';
    renderWithStore(<Secret />, { status: 'anonymous' });
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });

  it('sends authenticated users lacking the permission to /403', async () => {
    renderWithStore(<Secret />, { status: 'authenticated', permissions: [Permission.RolesRead] });
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/403'));
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('renders the page for permitted users', () => {
    renderWithStore(<Secret />, { status: 'authenticated', permissions: [Permission.UsersRead] });
    expect(screen.getByText('secret')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
