const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const promptUrl = (params = '') => {
  const base = pathToFileURL(path.join(process.cwd(), 'prompt.html')).toString();
  return params ? `${base}?${params}` : base;
};

test.describe('prompt modal', () => {
  test('carrega com tema claro padrão e campos preenchidos', async ({ page }) => {
    await page.goto(promptUrl('title=Autenticar&val=abc&description=Digite+o+token'));
    await expect(page.locator('#title')).toHaveText('Autenticar');
    await expect(page.locator('#description')).toHaveText('Digite o token');
    await expect(page.locator('#val')).toHaveValue('abc');
    await expect(page.locator('#ok')).toHaveText(/Confirmar/i);
  });

  test('respeita tema escuro via query string', async ({ page }) => {
    await page.goto(promptUrl('theme=dark'));
    const cardBg = await page.locator('.card').evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(cardBg).not.toBe('');
  });

  test('aceita cor de destaque customizada', async ({ page }) => {
    await page.goto(promptUrl('accent=%23ff6600'));
    const buttonBg = await page.locator('#ok').evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(buttonBg).toBe('rgb(255, 102, 0)');
  });
});
