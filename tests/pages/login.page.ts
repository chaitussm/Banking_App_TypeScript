import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:5174/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/^Email$/i).fill(email);
    await this.page.getByLabel(/^Password$/i).fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();
    await expect(this.page).toHaveURL(/\/dashboard$/);
  }
}
