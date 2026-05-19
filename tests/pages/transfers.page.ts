import { Page, expect } from '@playwright/test';

export class TransfersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:5174/transfers');
  }

  async isTransfersHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: /transfers/i })).toBeVisible();
  }
}
