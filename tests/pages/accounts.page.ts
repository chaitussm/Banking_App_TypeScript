import { Page, expect } from '@playwright/test';

export class AccountsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:5173/accounts');
  }

  async isAccountsHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: /^Accounts$/i })).toBeVisible();
  }

  async isAccountIdVisible(accountId: string) {
    await expect(this.page.getByText(new RegExp(accountId, 'i'))).toBeVisible();
  }
}
