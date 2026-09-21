import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { adminCredentials, login } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function scan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), null, 1)).toEqual([]);
}

test.describe('axe (WCAG 2.2 AA)', () => {
  for (const path of ['/login', '/register', '/403']) {
    test(`public page ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('main, form').first()).toBeVisible();
      await scan(page);
    });
  }

  test('login form with validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/required|valid|invalid/i).first()).toBeVisible();
    await scan(page);
  });

  test('admin users and roles screens', async ({ page }) => {
    const admin = adminCredentials();
    await login(page, admin.email, admin.password);
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await scan(page);
    await page.getByRole('link', { name: 'Roles' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await scan(page);
  });

  test('keyboard: login form is operable without a mouse', async ({ page }) => {
    await page.goto('/login');
    for (let i = 0; i < 10 && !(await page.getByLabel('Email').evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab'); // skip link, nav links, then the form
    }
    await expect(page.getByLabel('Email')).toBeFocused();
    await page.keyboard.type(`nobody-${Date.now()}@example.com`);
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();
    await page.keyboard.type('wrong-password-123');
    await page.keyboard.press('Enter');
    await expect(page.locator('form [role="alert"]')).toBeVisible();
  });
});
