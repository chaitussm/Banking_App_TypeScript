import { test, expect } from '@playwright/test';
import { login } from './helpers/session';
import { TransfersPage } from './pages/transfers.page';

const customerEmail = process.env.BANK_CUSTOMER_EMAIL || 'ava.smith@novabank.com';
const customerPassword = process.env.BANK_CUSTOMER_PASSWORD || 'ava@123';

test.describe('Transfers Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, customerEmail, customerPassword);
  });

  test('transfers page loads', async ({ page }) => {
    const transfersPage = new TransfersPage(page);
    await transfersPage.goto();
    await transfersPage.isTransfersHeadingVisible();
  });

});
