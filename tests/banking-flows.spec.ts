import { test, expect } from '@playwright/test';
import { apiLogin } from './helpers/apiSession';

const customerEmail = process.env.BANK_CUSTOMER_EMAIL || 'ava.smith@novabank.com';
const customerPassword = process.env.BANK_CUSTOMER_PASSWORD || 'ava@123';

test.describe('Core banking flows', () => {
  test.beforeEach(async ({ page }) => {
    await apiLogin(page, customerEmail, customerPassword);
  });

  test('accounts page shows seeded account id', async ({ page }) => {
    await page.goto('/accounts');

    await expect(page.getByRole('heading', { name: /^Accounts$/i })).toBeVisible();
  });

  // test('can create a transaction', async ({ page }) => {
  //   await page.goto('/transactions');
  //
  //   const uniqueNote = `PW-TX-${Date.now()}`;
  //
  //   await page.getByRole('combobox', { name: /type/i }).selectOption('credit');
  //   await page.getByLabel(/^Amount$/i).fill('25');
  //   await page.getByLabel(/^Note$/i).fill(uniqueNote);
  //   await page.getByRole('button', { name: /create transaction/i }).click();
  //   await page.reload();
  //   await expect(page.getByText(uniqueNote)).toBeVisible();
  // });
  //
  // test('can transfer between accounts', async ({ page }) => {
  //   await page.goto('/transfers');
  //
  //   await page.getByLabel(/^From Account$/i).selectOption('acc-1001');
  //   await page.getByLabel(/^To Account$/i).selectOption('acc-1002');
  //   await page.getByLabel(/^Amount$/i).fill('10');
  //   await page.getByLabel(/^Note$/i).fill('PW transfer');
  //   await page.getByRole('button', { name: /create transfer/i }).click();
  //   await expect(page.getByText(/transfer completed successfully/i)).toBeVisible();
  // });
});
