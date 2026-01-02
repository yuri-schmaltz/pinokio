const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const splashUrl = (params = '') => {
  const base = pathToFileURL(path.join(process.cwd(), 'splash.html')).toString();
  return params ? `${base}?${params}` : base;
};

test.describe('porta ocupada hint', () => {
  test('exibe detalhe quando porta está ocupada (simulado)', async ({ page }) => {
    const url = splashUrl('state=error&message=Porta ocupada&detail=A porta 42000 já está em uso&log=/tmp/stdout.txt');
    await page.goto(url);
    await expect(page.locator('#detail')).toContainText('porta');
    await expect(page.locator('#hint')).toContainText('/tmp/stdout.txt');
  });
});
