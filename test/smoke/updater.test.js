const assert = require('assert')
const { EventEmitter } = require('events')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const buildStubs = () => {
  const autoUpdater = new EventEmitter()
  autoUpdater.autoDownload = true
  autoUpdater.downloadUpdate = sinon.fake.resolves(undefined)
  autoUpdater.checkForUpdates = sinon.fake.resolves(undefined)

  const showMessageBox = sinon.fake.resolves({ response: 0 })
  const dialog = { showMessageBox }

  const progressInstance = {
    isCompleted: sinon.fake.returns(false),
    close: sinon.fake(),
    setCompleted: sinon.fake(),
    get value() {
      return this._value || 0
    },
    set value(v) {
      this._value = v
    },
    detail: '',
  }
  const ProgressBar = sinon.fake.returns(progressInstance)

  const stubs = {
    'electron-updater': { autoUpdater },
    'electron-progressbar': ProgressBar,
    electron: { dialog },
  }

  return { autoUpdater, dialog, ProgressBar, progressInstance, stubs }
}

const loadUpdater = (stubs) => proxyquire('../../updater', stubs)

describe('Updater flow', () => {
  it('downloads update when available and user accepts', async () => {
    const { autoUpdater, dialog, ProgressBar, progressInstance, stubs } = buildStubs()
    const Updater = loadUpdater(stubs)
    const updater = new Updater()
    updater.run({})

    autoUpdater.emit('update-available', { version: '1.2.3' })
    await Promise.resolve() // allow promise from dialog to resolve

    assert.strictEqual(dialog.showMessageBox.called, true)
    assert.strictEqual(ProgressBar.called, true)
    assert.strictEqual(autoUpdater.downloadUpdate.called, true)

    autoUpdater.emit('download-progress', { percent: 42, transferred: 42, total: 100 })
    assert.strictEqual(progressInstance.value, Math.floor(42))
    assert.ok(progressInstance.detail.includes('42'))

    autoUpdater.emit('update-downloaded', { version: '1.2.3' })
    assert.strictEqual(progressInstance.setCompleted.called, true)
  })

  it('closes progress bar on error', async () => {
    const { autoUpdater, ProgressBar, progressInstance, stubs } = buildStubs()
    const Updater = loadUpdater(stubs)
    const updater = new Updater()
    updater.run({})

    autoUpdater.emit('update-available', { version: '1.2.3' })
    await Promise.resolve()
    autoUpdater.emit('download-progress', { percent: 10, transferred: 10, total: 100 })
    autoUpdater.emit('error', new Error('network'))

    assert.strictEqual(ProgressBar.called, true)
    assert.strictEqual(progressInstance.close.called, true)
  })
})
