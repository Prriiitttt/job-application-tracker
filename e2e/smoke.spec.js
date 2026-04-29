import { test, expect } from '@playwright/test';

test('app shell loads at root', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('JobTrackr');
});
