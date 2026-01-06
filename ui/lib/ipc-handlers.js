/**
 * IPC handlers module for Pinokio.
 * Centralizes all IPC communication between main and renderer processes.
 */

const { ipcMain, BrowserWindow } = require('electron')

/**
 * Create and register all IPC handlers.
 * @param {object} options - Handler options
 * @param {object} options.logger - Logger instance
 * @param {function} options.buildWebPreferences - Web preferences builder
 * @returns {object} Handler management object
 */
const registerIpcHandlers = ({ logger = console, buildWebPreferences = null } = {}) => {
    const handlers = new Map()

    /**
     * Register a handler with error wrapping.
     * @param {string} channel - IPC channel name
     * @param {function} handler - Handler function
     */
    const register = (channel, handler) => {
        const wrappedHandler = async (event, ...args) => {
            try {
                logger.debug?.(`IPC: ${channel}`, { args: args.slice(0, 2) })
                return await handler(event, ...args)
            } catch (err) {
                logger.error?.(`IPC error on ${channel}: ${err.message}`, { stack: err.stack })
                throw err
            }
        }
        ipcMain.on(channel, wrappedHandler)
        handlers.set(channel, wrappedHandler)
    }

    /**
     * Register a handler that returns a value (handle vs on).
     * @param {string} channel - IPC channel name
     * @param {function} handler - Handler function
     */
    const handle = (channel, handler) => {
        const wrappedHandler = async (event, ...args) => {
            try {
                logger.debug?.(`IPC handle: ${channel}`, { args: args.slice(0, 2) })
                return await handler(event, ...args)
            } catch (err) {
                logger.error?.(`IPC handle error on ${channel}: ${err.message}`, { stack: err.stack })
                throw err
            }
        }
        ipcMain.handle(channel, wrappedHandler)
        handlers.set(channel, wrappedHandler)
    }

    /**
     * Unregister all handlers.
     */
    const unregisterAll = () => {
        for (const [channel] of handlers) {
            ipcMain.removeHandler(channel)
            ipcMain.removeAllListeners(channel)
        }
        handlers.clear()
    }

    // ===== Standard Handlers =====

    // Prompt dialog handler
    register('prompt', (eventRet, arg) => {
        let promptResponse = null
        const promptWindow = new BrowserWindow({
            width: 400,
            height: 150,
            show: false,
            modal: true,
            parent: BrowserWindow.getFocusedWindow(),
            webPreferences: buildWebPreferences ? buildWebPreferences('prompt') : {
                contextIsolation: true,
                nodeIntegration: false
            }
        })

        arg.val = arg.val || ''
        const promptHtml = `<html><body><form><label for="val">${arg.title}</label>
<input id="val" value="${arg.val}" autofocus />
<button id='ok'>OK</button>
<button id='cancel'>Cancel</button></form>
<style>body {font-family: sans-serif;} form {padding: 5px; } button {float:right; margin-left: 10px;} label { display: block; margin-bottom: 5px; width: 100%; } input {margin-bottom: 10px; padding: 5px; width: 100%; display:block;}</style>
<script>
document.querySelector("#cancel").addEventListener("click", (e) => {
  e.preventDefault()
  e.stopPropagation()
  window.close()
})
document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault()
  e.stopPropagation()
  window.electronAPI.send('prompt-response', document.querySelector("#val").value)
  window.close()
})
</script></body></html>`

        promptWindow.loadURL('data:text/html,' + encodeURIComponent(promptHtml))
        promptWindow.show()
        promptWindow.on('closed', () => {
            logger.debug?.('Prompt closed', { response: promptResponse })
            eventRet.returnValue = promptResponse
        })
    })

    // Prompt response handler
    register('prompt-response', (event, arg) => {
        if (arg === '') { arg = null }
        // This would need to be connected to the prompt handler above
        logger.debug?.('Prompt response received', { arg })
    })

    return {
        register,
        handle,
        unregisterAll,
        getHandlers: () => handlers
    }
}

module.exports = {
    registerIpcHandlers
}
