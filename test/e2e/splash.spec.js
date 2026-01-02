const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const splashUrl = () => pathToFileURL(path.join(process.cwd(), 'splash.html')).toString();

test.describe('splash screen', () => {
  test('exibe estado de loading com texto padrão', async ({ page }) => {
    await page.goto(splashUrl());
    await expect(page.locator('#title')).toHaveText('Iniciando o Pinokio…');
    await expect(page.locator('#status-text')).toHaveText('Preparando');
    await expect(page.locator('#loader')).toBeVisible();
    await expect(page.locator('#detail')).toBeHidden();
  });

  test('renderiza estado de erro com detalhe e ações', async ({ page }) => {
    const url = `${splashUrl()}?state=error&message=Falhou&detail=Porta ocupada&log=/tmp/stdout.txt&theme=dark`;
    await page.goto(url);
    await expect(page.locator('#title')).toHaveText('Falhou');
    await expect(page.locator('#status-text')).toHaveText('Falhou');
    await expect(page.locator('#loader')).toBeHidden();
    await expect(page.locator('#detail')).toBeVisible();
    await expect(page.locator('#detail')).toContainText('Porta ocupada');
    await expect(page.locator('#hint')).toContainText('/tmp/stdout.txt');
    await expect(page.locator('#retry')).toBeVisible();
    await expect(page.locator('#copy-log')).toBeVisible();
  });

  test('aceita cor de destaque customizada', async ({ page }) => {
    const url = `${splashUrl()}?accent=%23ff6600`;
    await page.goto(url);
    const pillColor = await page.locator('.pill').evaluate((node) => getComputedStyle(node).color);
    expect(pillColor).toBe('rgb(255, 102, 0)');
  });
});
