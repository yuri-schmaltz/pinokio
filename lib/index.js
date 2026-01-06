/**
 * Pinokio library modules.
 * Re-exports all lib modules for convenient importing.
 */

const splash = require('./splash')
const browserLogging = require('./browser-logging')
const utils = require('./utils')
const inspector = require('./inspector')

module.exports = {
    splash,
    browserLogging,
    utils,
    inspector,
    // Re-export commonly used functions at top level
    ...splash,
    ...utils,
    createBrowserLogger: browserLogging.createBrowserLogger,
    // Inspector functions
    ...inspector
}
