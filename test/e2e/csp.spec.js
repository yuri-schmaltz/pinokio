const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const fileUrl = (name, params = '') => {
  const base = pathToFileURL(path.join(process.cwd(), name)).toString();
  return params ? `${base}?${params}` : base;
};

test.describe('CSP presence', () => {
  test('splash possui meta CSP', async ({ page }) => {
    await page.goto(fileUrl('splash.html'));
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("default-src 'self'");
  });

  test('prompt possui meta CSP', async ({ page }) => {
    await page.goto(fileUrl('prompt.html'));
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("default-src 'self'");
  });
});
