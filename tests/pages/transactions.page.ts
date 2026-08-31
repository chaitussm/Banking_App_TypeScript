import { Page, expect } from '@playwright/test';

export class TransactionsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/transactions');
  }

  async isTransactionsHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: /transactions/i })).toBeVisible();
  }
}
