import { test, expect } from '@playwright/test';

const TEST_BED_URL = 'https://local.cord.com:8179/sdk/test/';

async function makeScreenshotTestForComponentSet(page, componentSet) {
  await page.goto(TEST_BED_URL);
  const componentSetSelector = page.getByLabel('Component set');
  await componentSetSelector.selectOption(componentSet);
  const sideBarThread = page
    .locator('cord-sidebar [data-cy="cord-thread"]')
    .first();

  await expect(sideBarThread).toBeVisible();
  await expect(page).toHaveScreenshot();
}

test('presence pixel diff', async ({ page }) => {
  await makeScreenshotTestForComponentSet(page, 'presence');
});

test('other pixel diff', async ({ page }) => {
  await makeScreenshotTestForComponentSet(page, 'other');
});
