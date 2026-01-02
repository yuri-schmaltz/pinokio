const { test, expect, _electron: electron } = require('@playwright/test')
const path = require('path')

test.describe('tray/updater (instrumentado)', () => {
  test('carrega app com mock e mantém janela viva', async () => {
    test.skip(true, 'Requer ambiente com Electron render rodando; habilite manualmente quando suportado.')
    let app
    try {
      app = await electron.launch({
        args: ['.'],
        env: {
          ...process.env,
          PINOKIO_TEST_MODE: '1',
          PINOKIO_PORT_IN_USE: '0',
          ELECTRON_ENABLE_LOGGING: '1',
        },
      })
      const page = await app.firstWindow()
      await page.waitForTimeout(700)
      await expect(page).toBeDefined()
    } finally {
      if (app) {
        await app.close()
      }
    }
  })
})
