const assert = require('assert')
const sinon = require('sinon')
const { installPermissionHandler, installCertificateErrorHandler } = require('../../permissions')

describe('permissions helpers', () => {
  it('permite apenas itens da allowlist', () => {
    const callbacks = []
    const session = {
      setPermissionRequestHandler: (fn) => {
        callbacks.push(fn)
      }
    }
    const allowlist = new Set(['display-capture'])
    installPermissionHandler(session, allowlist, 'test')
    assert.strictEqual(callbacks.length, 1)

    const callback = callbacks[0]
    let allowed = null
    callback({ getURL: () => 'http://example.com' }, 'display-capture', (result) => { allowed = result })
    assert.strictEqual(allowed, true)
    callback({ getURL: () => 'http://example.com' }, 'camera', (result) => { allowed = result })
    assert.strictEqual(allowed, false)
  })

  it('bloqueia erros de certificado', () => {
    const listeners = {}
    const app = {
      on: (event, handler) => {
        listeners[event] = handler
      }
    }
    installCertificateErrorHandler(app)
    assert.ok(listeners['certificate-error'])

    let callbackResult = null
    const event = { preventDefault: sinon.fake() }
    listeners['certificate-error'](event, null, 'https://badcert', new Error('cert'), null, (result) => { callbackResult = result })
    assert.strictEqual(event.preventDefault.called, true)
    assert.strictEqual(callbackResult, false)
  })
})
