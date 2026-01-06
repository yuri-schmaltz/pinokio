/**
 * Pinokio library modules.
 * Re-exports all lib modules for convenient importing.
 */

const splash = require('./splash')
const browserLogging = require('./browser-logging')
const utils = require('./utils')
const inspector = require('./inspector')
const logger = require('./logger')
const ipcHandlers = require('./ipc-handlers')
const security = require('./security')
const health = require('./health')

module.exports = {
    splash,
    browserLogging,
    utils,
    inspector,
    logger,
    ipcHandlers,
    security,
    health,
    // Re-export commonly used functions
    ...splash,
    ...utils,
    ...logger,
    ...security,
    ...health,
    createBrowserLogger: browserLogging.createBrowserLogger,
    registerIpcHandlers: ipcHandlers.registerIpcHandlers,
    ...inspector
}

