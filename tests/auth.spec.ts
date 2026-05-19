import { test, expect } from '@playwright/test';
import { login } from './helpers/session';
import { logout } from './helpers/session';

const customerEmail = process.env.BANK_CUSTOMER_EMAIL || 'ava.smith@novabank.com';
const customerPassword = process.env.BANK_CUSTOMER_PASSWORD || 'ava@123';
const managerEmail = process.env.BANK_MANAGER_EMAIL || 'mia.johnson@novabank.com';
const managerPassword = process.env.BANK_MANAGER_PASSWORD || 'mia@123';

test.describe('Authentication and role routing', () => {
  test('customer can login and cannot access users page', async ({ page }) => {
    await login(page, customerEmail, customerPassword);
    await expect(page.getByRole('heading', { name: /novabank banking application/i })).toBeVisible();

    await page.goto('/users');
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole('heading', { name: /unauthorized/i })).toBeVisible();

    await logout(page);
  });

  test('manager can access users page', async ({ page }) => {
    await login(page, managerEmail, managerPassword);
    await page.goto('/users');

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('heading', { name: /^Users$/i })).toBeVisible();
    await expect(page.getByText(/ava\.smith@novabank\.com/i)).toBeVisible();

    await logout(page);
  });
});
