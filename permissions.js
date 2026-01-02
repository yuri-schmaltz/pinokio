const installPermissionHandler = (session, allowlist, contextLabel = 'window') => {
  if (!session || typeof session.setPermissionRequestHandler !== 'function') {
    return
  }
  const allowed = allowlist || new Set()
  session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allow = allowed.has(permission)
    try {
      console.log('[PERMISSION]', { context: contextLabel, url: webContents?.getURL ? webContents.getURL() : null, permission, allow })
    } catch (_) {}
    callback(allow)
  })
}

const installCertificateErrorHandler = (app) => {
  if (!app || typeof app.on !== 'function') {
    return
  }
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault()
    console.error('[CERT-ERROR]', { url, error })
    callback(false)
  })
}

module.exports = {
  installPermissionHandler,
  installCertificateErrorHandler,
}
