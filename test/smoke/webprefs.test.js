const assert = require('assert')

const loadPrefs = () => {
  delete require.cache[require.resolve('../../webprefs')]
  return require('../../webprefs')
}

describe('web preferences', () => {
  afterEach(() => {
    delete process.env.PINOKIO_HARDEN_RENDERER
    delete require.cache[require.resolve('../../webprefs')]
  })

  it('defaults to relaxed settings', () => {
    delete process.env.PINOKIO_HARDEN_RENDERER
    const { buildWebPreferences, ALLOWED_PERMISSIONS, HARDEN_RENDERER } = loadPrefs()
    const prefs = buildWebPreferences('test-default')
    assert.strictEqual(HARDEN_RENDERER, false)
    assert.strictEqual(prefs.webSecurity, false)
    assert.strictEqual(prefs.contextIsolation, false)
    assert.strictEqual(prefs.nodeIntegrationInSubFrames, true)
    assert.ok(ALLOWED_PERMISSIONS.has('display-capture'))
    assert.ok(ALLOWED_PERMISSIONS.has('desktopCapture'))
  })

  it('enables hardening when flag is set', () => {
    process.env.PINOKIO_HARDEN_RENDERER = '1'
    const { buildWebPreferences, HARDEN_RENDERER } = loadPrefs()
    const prefs = buildWebPreferences('test-hardened')
    assert.strictEqual(HARDEN_RENDERER, true)
    assert.strictEqual(prefs.webSecurity, true)
    assert.strictEqual(prefs.contextIsolation, true)
    assert.strictEqual(prefs.nodeIntegrationInSubFrames, false)
  })

  it('uses fallback session when electron is unavailable', () => {
    delete process.env.PINOKIO_HARDEN_RENDERER
    const Module = require('module')
    const originalLoad = Module._load
    Module._load = function (request, parent, isMain) {
      if (request === 'electron') {
        const err = new Error('Electron not available in test')
        err.code = 'MODULE_NOT_FOUND'
        throw err
      }
      return originalLoad.apply(this, arguments)
    }
    try {
      delete require.cache[require.resolve('../../webprefs')]
      const { buildWebPreferences } = require('../../webprefs')
      const prefs = buildWebPreferences('no-electron')
      assert.ok(prefs.session)
      assert.strictEqual(typeof prefs.session.clearStorageData, 'function')
    } finally {
      Module._load = originalLoad
      delete require.cache[require.resolve('../../webprefs')]
    }
  })
})
