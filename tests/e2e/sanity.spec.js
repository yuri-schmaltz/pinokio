const { test, expect } = require('@playwright/test');

test('e2e: playwright harness is working', async ({ page }) => {
  await page.setContent('<main><h1>Pinokio E2E Sanity</h1></main>');
  await expect(page.getByRole('heading', { name: 'Pinokio E2E Sanity' })).toBeVisible();
});
