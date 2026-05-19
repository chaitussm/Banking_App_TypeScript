import { request, APIRequestContext, expect, Page } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function apiLogin(page: Page, email: string, password: string): Promise<void> {
  // Perform login via backend API
  const requestContext: APIRequestContext = await request.newContext();
  const response = await requestContext.post(`${API_URL}/api/login`, {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
  const cookies = await requestContext.storageState();
  // Set cookies in browser context
  await page.context().addCookies(cookies.cookies.map(c => ({ ...c, url: API_URL })));
  // Navigate to dashboard
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);
}
