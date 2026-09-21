import { expect, test } from '@playwright/test';
import { adminCredentials, login, logout, PASSWORD } from './helpers';

const email = `e2e-${Date.now()}@example.com`;

test.describe.configure({ mode: 'serial' });

test('register -> login -> no admin access -> logout', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Name').fill('E2E User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/login\?registered=1/);
  await expect(page.getByRole('status')).toContainText('Account created');

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);

  // forbidden path: the UI guard redirects and the API itself answers 403
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/403/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('403');
  const api = await page.request.get('/api/users');
  expect(api.status()).toBe(403);

  await page.goto('/');
  await logout(page);
  const me = await page.request.get('/api/auth/me');
  expect(me.status()).toBe(401);
});

test('bad credentials show one generic error', async ({ page }) => {
  await login(page, `nobody-${Date.now()}@example.com`, 'wrong-password-123');
  await expect(page.locator('form [role="alert"]')).toContainText(/invalid email or password/i);
});

test('admin: login -> users list shows the new user -> roles -> logout', async ({ page }) => {
  const admin = adminCredentials();
  await login(page, admin.email, admin.password);
  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('table')).toContainText(email);
  await page.getByRole('link', { name: 'Roles' }).click();
  await expect(page).toHaveURL(/\/admin\/roles/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await logout(page);
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/login/);
});
