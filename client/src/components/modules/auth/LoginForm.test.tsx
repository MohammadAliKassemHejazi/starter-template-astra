import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Permission } from '@project/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../interfaces/api-error';
import * as authService from '../../../services/auth-service';
import { renderWithStore } from '../../../utils/render-with-store';
import { LoginForm } from './LoginForm';

const replace = vi.fn();
let query: Record<string, string> = {};
vi.mock('next/router', () => ({ useRouter: () => ({ replace, query }) }));
vi.mock('../../../services/auth-service');
const svc = vi.mocked(authService);

const session = {
  user: { id: 'u1', email: 'a@b.co', name: 'Ann', isActive: true, lastLoginAt: null, createdAt: '2026-01-01', roles: [] },
  permissions: [Permission.UsersRead],
};

function fill(email: string, password: string): void {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    query = {};
  });

  it('has labelled inputs and validates with the shared schema (aria-invalid + role=alert)', async () => {
    renderWithStore(<LoginForm />);
    fill('not-an-email', '');
    const email = await screen.findByLabelText('Email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email.getAttribute('aria-describedby')).toBe('email-error');
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    expect(svc.loginRequest).not.toHaveBeenCalled();
  });

  it('moves focus to the first invalid field on failed validation', async () => {
    renderWithStore(<LoginForm />);
    fill('not-an-email', '');
    await screen.findAllByRole('alert');
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('submits normalized credentials and redirects to a safe next', async () => {
    svc.loginRequest.mockResolvedValue(session);
    query = { next: '/admin/users' };
    renderWithStore(<LoginForm />);
    fill('  A@B.co ', 'pw');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/users'));
    expect(svc.loginRequest).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pw' });
  });

  it.each(['https://evil.com', '//evil.com', '/\\evil.com'])('ignores unsafe next %s', async (next) => {
    svc.loginRequest.mockResolvedValue(session);
    query = { next };
    renderWithStore(<LoginForm />);
    fill('a@b.co', 'pw');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('shows the generic server error in an alert and stays on the page', async () => {
    svc.loginRequest.mockRejectedValue(new ApiError('Invalid email or password', 401));
    renderWithStore(<LoginForm />);
    fill('a@b.co', 'wrong');
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('disables submit while pending', async () => {
    svc.loginRequest.mockReturnValue(new Promise(() => undefined));
    renderWithStore(<LoginForm />);
    fill('a@b.co', 'pw');
    expect(await screen.findByRole('button', { name: 'Signing in…' })).toBeDisabled();
  });
});
