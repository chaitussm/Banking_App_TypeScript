import { Page, expect } from '@playwright/test';

export class UnauthorizedPage {
  constructor(private page: Page) {}

  async isUnauthorizedHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: /unauthorized/i })).toBeVisible();
  }
}
