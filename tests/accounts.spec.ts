import { test, expect } from '@playwright/test';
import { apiLogin } from './helpers/apiSession';
import { AccountsPage } from './pages/accounts.page';

const customerEmail = process.env.BANK_CUSTOMER_EMAIL || 'ava.smith@novabank.com';
const customerPassword = process.env.BANK_CUSTOMER_PASSWORD || 'ava@123';

test.describe('Accounts Page', () => {
  test.beforeEach(async ({ page }) => {
    await apiLogin(page, customerEmail, customerPassword);
  });

  test('accounts page loads and shows account id', async ({ page }) => {
    const accountsPage = new AccountsPage(page);
    await accountsPage.goto();
    await accountsPage.isAccountsHeadingVisible();
    await accountsPage.isAccountIdVisible('acc-1001');
  });
});
