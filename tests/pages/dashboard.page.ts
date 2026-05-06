import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:5173/dashboard');
  }

  async isWelcomeVisible() {
    await expect(this.page.getByRole('heading', { name: /welcome/i })).toBeVisible();
  }
}
