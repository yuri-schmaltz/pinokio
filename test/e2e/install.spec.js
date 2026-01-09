const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

let serverProcess;
const PORT = 42000;

const waitForPort = (port) => new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
        if (Date.now() - start > 30000) return reject(new Error('Timeout waiting for server'));
        const socket = net.connect(port, 'localhost');
        socket.on('connect', () => {
            socket.end();
            resolve();
        });
        socket.on('error', () => setTimeout(tryConnect, 200));
    };
    tryConnect();
});

test.beforeAll(async () => {
    const scriptPath = path.join(process.cwd(), 'node_modules', 'pinokiod', 'script', 'index.js');
    console.log(`Starting backend: node ${scriptPath}`);

    serverProcess = spawn('node', [scriptPath], {
        stdio: 'pipe',
        env: { ...process.env, PORT: PORT.toString() }
    });

    serverProcess.stdout.on('data', (d) => console.log(`[SERVER]: ${d}`));
    serverProcess.stderr.on('data', (d) => console.error(`[SERVER ERR]: ${d}`));

    await waitForPort(PORT);
    console.log('Server is ready!');
});

test.afterAll(() => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

test.describe('Install Flow', () => {
    test('loads discover page, shows mock app, and verifies install link', async ({ page }) => {
        // Mock the featured feed
        await page.route('https://pinokiocomputer.github.io/sitefeed/featured.json', async route => {
            const json = [{
                title: "Mock App",
                description: "A test app for QA",
                download: "https://github.com/pinokiocomputer/test-app",
                image: "" // Empty image to test fallback/no error
            }];
            await route.fulfill({ json });
        });

        // Go to discover page directly
        const discoverUrl = `http://localhost:${PORT}/discover_native`;
        await page.goto(discoverUrl);

        // Verify mock app is displayed
        const card = page.locator('.card', { hasText: 'Mock App' });
        await expect(card).toBeVisible();

        // Verify card link structure
        // href should be /item_native?uri=...
        await expect(card).toHaveAttribute('href', /^\/item_native\?uri=https%3A%2F%2Fgithub\.com%2Fpinokiocomputer%2Ftest-app/);

        // Click the card and wait for navigation
        await card.click();
        await expect(page).toHaveURL(/.*\/item_native.*/);

        // Verify Item Details Page
        const installBtn = page.locator('.install-btn');
        await expect(installBtn).toBeVisible();
        await expect(page.locator('h1.title')).toHaveText('Mock App');

        // Verify Install Button Link
        // Should go to /?mode=download&uri=...
        await expect(installBtn).toHaveAttribute('href', /^\/\?mode=download&uri=https%3A%2F%2Fgithub\.com%2Fpinokiocomputer%2Ftest-app/);

        // We stop here to avoid actual download which might fail or be heavy.
        // Verifying the button exists and points to the correct download action covers the UI flow.
    });
});
