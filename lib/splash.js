/**
 * Splash window management for Pinokio startup.
 * Handles splash screen display, loading states, and error presentation.
 */

const { BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')

let splashWindow = null
let splashIcon = null

/**
 * Get the default log file path hint for error displays.
 * @param {object} pinokiod - The pinokiod instance (optional)
 * @returns {string} Path to the log file
 */
const getLogFileHint = (pinokiod) => {
    try {
        if (pinokiod && pinokiod.kernel && pinokiod.kernel.homedir) {
            return path.resolve(pinokiod.kernel.homedir, "logs", "stdout.txt")
        }
    } catch (err) {
        // Fall through to default
    }
    return path.resolve(os.homedir(), ".pinokio", "logs", "stdout.txt")
}

/**
 * Get the splash icon path, caching the result.
 * @param {string} baseDir - Base directory to search for icons
 * @returns {string} Relative path to the icon
 */
const getSplashIcon = (baseDir = __dirname) => {
    if (splashIcon) {
        return splashIcon
    }
    const candidates = [
        path.join('assets', 'icon.png'),
        path.join('assets', 'icon_small@2x.png'),
        path.join('assets', 'icon_small.png'),
        'icon2.png'
    ]
    for (const relative of candidates) {
        const absolute = path.join(baseDir, relative)
        if (fs.existsSync(absolute)) {
            splashIcon = relative.split(path.sep).join('/')
            return splashIcon
        }
    }
    splashIcon = path.join('assets', 'icon_small.png').split(path.sep).join('/')
    return splashIcon
}

/**
 * Ensure splash window exists, creating if necessary.
 * @returns {BrowserWindow} The splash window instance
 */
const ensureSplashWindow = () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
        return splashWindow
    }
    splashWindow = new BrowserWindow({
        width: 420,
        height: 320,
        frame: false,
        resizable: false,
        transparent: true,
        show: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        fullscreenable: false,
        webPreferences: {
            backgroundThrottling: false
        }
    })
    splashWindow.on('closed', () => {
        splashWindow = null
    })
    return splashWindow
}

/**
 * Update splash window content.
 * @param {object} options - Display options
 * @param {string} options.state - 'loading' or 'error'
 * @param {string} options.message - Main message to display
 * @param {string} options.detail - Detail text (truncated to 800 chars)
 * @param {string} options.logPath - Path to log file
 * @param {string} options.icon - Icon path
 * @param {string} baseDir - Base directory for splash.html
 */
const updateSplashWindow = ({ state = 'loading', message, detail, logPath, icon } = {}, baseDir = __dirname) => {
    const win = ensureSplashWindow()
    const query = { state }
    if (message) {
        query.message = message
    }
    if (detail) {
        const trimmed = detail.length > 800 ? `${detail.slice(0, 800)}…` : detail
        query.detail = trimmed
    }
    if (logPath) {
        query.log = logPath
    }
    if (icon) {
        query.icon = icon
    }
    win.loadFile(path.join(baseDir, 'splash.html'), { query }).finally(() => {
        if (!win.isDestroyed()) {
            win.show()
        }
    })
}

/**
 * Close the splash window if open.
 */
const closeSplashWindow = () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close()
    }
}

/**
 * Format an error for display in the splash window.
 * @param {Error|string|object} error - The error to format
 * @returns {string} Formatted error string
 */
const formatStartupError = (error) => {
    if (!error) {
        return ''
    }
    if (error.stack) {
        return `${error.message || 'Unknown error'}\n\n${error.stack}`
    }
    if (error.message) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    try {
        return JSON.stringify(error, null, 2)
    } catch (err) {
        return String(error)
    }
}

/**
 * Show a startup error in the splash window.
 * @param {object} options - Error display options
 * @param {string} options.message - Error title
 * @param {string} options.detail - Error details
 * @param {Error} options.error - Error object to format
 * @param {object} pinokiod - Pinokiod instance for log path
 * @param {string} baseDir - Base directory
 */
const showStartupError = ({ message, detail, error } = {}, pinokiod = null, baseDir = __dirname) => {
    const formatted = detail || formatStartupError(error)
    updateSplashWindow({
        state: 'error',
        message: message || 'Pinokio could not start',
        detail: formatted,
        logPath: getLogFileHint(pinokiod),
        icon: getSplashIcon(baseDir)
    }, baseDir)
}

/**
 * Reset module state (for testing).
 */
const resetState = () => {
    splashWindow = null
    splashIcon = null
}

module.exports = {
    getLogFileHint,
    getSplashIcon,
    ensureSplashWindow,
    updateSplashWindow,
    closeSplashWindow,
    formatStartupError,
    showStartupError,
    resetState
}
