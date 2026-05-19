import { test, expect } from '@playwright/test';
import { apiLogin } from './helpers/apiSession';
import { UsersPage } from './pages/users.page';

const managerEmail = process.env.BANK_MANAGER_EMAIL || 'mia.johnson@novabank.com';
const managerPassword = process.env.BANK_MANAGER_PASSWORD || 'mia@123';

test.describe('Users Page (Manager Access)', () => {
  test.beforeEach(async ({ page }) => {
    await apiLogin(page, managerEmail, managerPassword);
  });

  test('users page loads for manager', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();
    await usersPage.isUsersHeadingVisible();
    await usersPage.isUserEmailVisible('ava.smith@novabank.com');
  });
});
