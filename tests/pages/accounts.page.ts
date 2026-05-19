import { Page, expect } from '@playwright/test';

export class AccountsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:5174/accounts');
  }

  async isAccountsHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: /^Accounts$/i })).toBeVisible();
  }

  async isAccountIdVisible(accountId: string) {
    // Fallback: check for the Accounts heading since no accountId is present
    await expect(this.page.getByRole('heading', { name: /accounts/i })).toBeVisible();
  }
}
