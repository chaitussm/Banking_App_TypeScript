import { Page, expect } from '@playwright/test';

export class TransfersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/transfers');
  }

  async isTransfersHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: /transfers/i })).toBeVisible();
  }
}
