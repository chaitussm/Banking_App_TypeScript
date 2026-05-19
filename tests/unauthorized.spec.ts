import { test, expect } from '@playwright/test';
import { apiLogin } from './helpers/apiSession';
import { UnauthorizedPage } from './pages/unauthorized.page';

const customerEmail = process.env.BANK_CUSTOMER_EMAIL || 'ava.smith@novabank.com';
const customerPassword = process.env.BANK_CUSTOMER_PASSWORD || 'ava@123';

test.describe('Unauthorized Page', () => {
  test.beforeEach(async ({ page }) => {
    await apiLogin(page, customerEmail, customerPassword);
  });

  test('unauthorized page loads when accessing restricted page', async ({ page }) => {
    await page.goto('http://localhost:5174/users');
    await expect(page).toHaveURL(/\/unauthorized$/);
    const unauthorizedPage = new UnauthorizedPage(page);
    await unauthorizedPage.isUnauthorizedHeadingVisible();
  });
});
