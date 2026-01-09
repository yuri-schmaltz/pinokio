let session
try {
  session = require('electron').session
} catch (err) {
  session = null
}
if (!session || typeof session.fromPartition !== 'function') {
  // Fallback for Node-only test environments; real app will use Electron's session.
  session = {
    fromPartition: () => ({
      clearStorageData: async () => {},
    }),
  }
}
const path = require('path')

const HARDEN_RENDERER = process.env.PINOKIO_HARDEN_RENDERER === '1' ? true : false
const ALLOWED_PERMISSIONS = new Set(['display-capture', 'desktopCapture'])

const buildWebPreferences = (label) => {
  const hardened = HARDEN_RENDERER
  if (hardened) {
    console.log('[WEBPREFS]', { label, hardened })
  }
  return {
    session: session.fromPartition('temp-window-' + Date.now()),
    webSecurity: hardened ? true : false,
    nativeWindowOpen: true,
    contextIsolation: hardened ? true : false,
    nodeIntegrationInSubFrames: hardened ? false : true,
    enableRemoteModule: false,
    experimentalFeatures: true,
    preload: path.join(__dirname, 'preload.js')
  }
}

module.exports = {
  HARDEN_RENDERER,
  ALLOWED_PERMISSIONS,
  buildWebPreferences,
}
