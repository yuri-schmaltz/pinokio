const assert = require('assert')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const vm = require('vm')

const loadPreload = (sandbox) => {
  const code = fs.readFileSync(path.join(__dirname, '../../preload.js'), 'utf8')
  vm.runInNewContext(code, sandbox, { filename: 'preload.js' })
}

describe('preload iframe navigation', () => {
  it('envia mensagens de localização e reage a back/forward/refresh', () => {
    const parentPostMessage = sinon.fake()
    let intervalFn = null
    const messageHandlers = []

    const callFlags = { back: 0, forward: 0, reload: 0 }
    const history = {
      back: () => { callFlags.back += 1 },
      forward: () => { callFlags.forward += 1 },
      reload: () => { callFlags.reload += 1 },
    }

    const sandbox = {
      console: { log: () => {}, warn: () => {}, error: () => {} },
      require: (moduleName) => {
        if (moduleName === 'electron') {
          const on = sinon.fake()
          const once = sinon.fake()
          const removeListener = sinon.fake()
          const removeAllListeners = sinon.fake()
          return {
            ipcRenderer: {
              sendSync: () => null,
              send: () => {},
              invoke: () => Promise.resolve(),
              on,
              once,
              removeListener,
              removeAllListeners,
            },
            contextBridge: {
              exposeInMainWorld: () => {},
            },
          }
        }
        throw new Error(`Unexpected require: ${moduleName}`)
      },
      module: { exports: {} },
      exports: {},
      window: null,
      setInterval: (fn) => {
        intervalFn = fn
        fn()
        return 1
      },
      clearInterval: () => {},
    }

    const makeElement = () => ({
      style: {},
      classList: { contains: () => false, add: () => {}, remove: () => {} },
      appendChild: () => {},
      removeChild: () => {},
      remove: () => {},
      setAttribute: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 10, height: 10 }),
      querySelectorAll: () => [],
      querySelector: () => null,
      ownerDocument: null,
    })

    const documentElement = makeElement()
    const bodyElement = makeElement()
    bodyElement.contains = () => true

    const locationObj = { href: 'http://initial', reload: () => { callFlags.reload += 1 } }

    const windowObj = {
      parent: { postMessage: parentPostMessage, location: { href: 'http://parent' } },
      top: {},
      location: locationObj,
      history,
      addEventListener: (type, handler) => {
        messageHandlers.push({ type, handler })
      },
      console: sandbox.console,
      document: null,
      getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' }),
    }
    windowObj.document = {
      location: windowObj.location,
      createElement: () => makeElement(),
      documentElement,
      body: bodyElement,
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
    }

    sandbox.window = windowObj
    sandbox.document = windowObj.document
    sandbox.location = sandbox.window.location
    sandbox.history = history
    sandbox.Node = { ELEMENT_NODE: 1 }

    loadPreload(sandbox)

    // Mensagem inicial
    assert.strictEqual(parentPostMessage.called, true)
    const firstCall = parentPostMessage.getCall(0).args[0]
    assert.strictEqual(firstCall.action.type, 'location')
    assert.strictEqual(firstCall.action.url, 'http://initial')

    // Simular mudança de URL
    sandbox.window.location.href = 'http://next'
    intervalFn()
    const lastCall = parentPostMessage.getCall(parentPostMessage.callCount - 1).args[0]
    assert.strictEqual(lastCall.action.url, 'http://next')

    // Acionar handlers de mensagem
    assert.ok(messageHandlers.length > 0, 'handler de mensagem deve existir')
    const messageHandler = messageHandlers.find((h) => h.type === 'message')?.handler
    assert.ok(messageHandler, 'handler de mensagem deve existir')
    messageHandler.call(windowObj, { data: { action: 'back' } })
    messageHandler.call(windowObj, { data: { action: 'forward' } })
    messageHandler.call(windowObj, { data: { action: 'refresh' } })

    assert.ok(callFlags.back > 0, 'history.back deve ser chamado')
    assert.ok(callFlags.forward > 0, 'history.forward deve ser chamado')
    assert.ok(callFlags.reload > 0, 'history.reload deve ser chamado')
  })
})
