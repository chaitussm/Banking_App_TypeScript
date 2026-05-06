import { Page, expect } from '@playwright/test';

export class UsersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:5173/users');
  }

  async isUsersHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: /^Users$/i })).toBeVisible();
  }

  async isUserEmailVisible(email: string) {
    await expect(this.page.getByText(new RegExp(email, 'i'))).toBeVisible();
  }
}
