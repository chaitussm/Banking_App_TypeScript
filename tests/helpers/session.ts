import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('http://localhost:5174/login');
  await page.getByLabel(/^Email$/i).fill(email);
  await page.getByLabel(/^Password$/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  try {
    await expect(page).toHaveURL(/\/dashboard$/);
  } catch (e) {
    // Print any error message shown on the login page
    const errorMsg = await page.locator('[role="alert"], .error, .alert').first().textContent();
    console.error('Login failed. Error message:', errorMsg);
    // Print the full page content for debugging (to see if it's HTML)
    const pageContent = await page.content();
    console.error('Login failed. Full page content:', pageContent.slice(0, 500)); // Print first 500 chars
    throw e;
  }
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page).toHaveURL(/\/login$/);
}
