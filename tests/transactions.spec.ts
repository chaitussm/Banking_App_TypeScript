import { test, expect } from '@playwright/test';
import { apiLogin } from './helpers/apiSession';
import { TransactionsPage } from './pages/transactions.page';

const customerEmail = process.env.BANK_CUSTOMER_EMAIL || 'ava.smith@novabank.com';
const customerPassword = process.env.BANK_CUSTOMER_PASSWORD || 'ava@123';

test.describe('Transactions Page', () => {
  test.beforeEach(async ({ page }) => {
    await apiLogin(page, customerEmail, customerPassword);
  });

  test('transactions page loads', async ({ page }) => {
    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
    await transactionsPage.isTransactionsHeadingVisible();
  });
});
