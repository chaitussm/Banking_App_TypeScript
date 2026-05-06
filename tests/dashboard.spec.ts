import { test, expect } from '@playwright/test';
import { login } from './helpers/session';
import { DashboardPage } from './pages/dashboard.page';

const customerEmail = process.env.BANK_CUSTOMER_EMAIL || 'ava.smith@novabank.com';
const customerPassword = process.env.BANK_CUSTOMER_PASSWORD || 'ava@123';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, customerEmail, customerPassword);
  });

  test('dashboard loads and shows welcome', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.isWelcomeVisible();
  });
});
