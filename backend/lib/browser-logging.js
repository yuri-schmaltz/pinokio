/**
 * Browser console logging utilities for Pinokio.
 * Handles logging browser console output to files.
 */

const fs = require('fs')
const path = require('path')

/**
 * Create a browser logging manager instance.
 * @param {object} options - Configuration options
 * @param {boolean} options.enabled - Whether logging is enabled
 * @param {object} options.pinokiod - Pinokiod instance for path resolution
 * @param {function} options.shouldLogUrl - Function to determine if URL should be logged
 * @returns {object} Browser logging manager
 */
const createBrowserLogger = ({ enabled = false, pinokiod = null, shouldLogUrl = null } = {}) => {
    const state = {
        enabled,
        browserLogFilePath: null,
        browserLogFileReady: false,
        browserLogBuffer: [],
        consoleState: new WeakMap(),
        attachedListeners: new WeakSet()
    }

    const consoleLevelLabels = ['log', 'info', 'warn', 'error', 'debug']

    /**
     * Safely parse a URL.
     * @param {string} value - URL string to parse
     * @param {string} base - Base URL for relative resolution
     * @returns {URL|null} Parsed URL or null
     */
    const safeParseUrl = (value, base) => {
        if (!value) return null
        try {
            return base ? new URL(value, base) : new URL(value)
        } catch (err) {
            return null
        }
    }

    /**
     * Resolve console source URL.
     * @param {string} sourceId - Source identifier
     * @param {string} pageUrl - Page URL
     * @returns {string|null} Resolved URL or null
     */
    const resolveConsoleSourceUrl = (sourceId, pageUrl) => {
        const page = safeParseUrl(pageUrl)
        const source = safeParseUrl(sourceId, page ? page.href : undefined)
        if (source && (source.protocol === 'http:' || source.protocol === 'https:' || source.protocol === 'file:')) {
            return source.href
        }
        return page ? page.href : null
    }

    /**
     * Get the browser log file path.
     * @returns {string|null} Log file path or null if not available
     */
    const getBrowserLogFile = () => {
        if (!state.enabled) return null
        if (!state.browserLogFilePath) {
            if (!pinokiod || !pinokiod.kernel || !pinokiod.kernel.homedir) {
                return null
            }
            try {
                state.browserLogFilePath = pinokiod.kernel.path('logs/browser.log')
            } catch (err) {
                console.error('[BROWSER LOG] Failed to resolve browser log file path', err)
                return null
            }
        }
        return state.browserLogFilePath
    }

    /**
     * Ensure browser log file is ready for writing.
     * @param {string} rootUrl - Root URL for filtering
     * @returns {string|null} Log file path or null
     */
    const ensureBrowserLogFile = (rootUrl) => {
        if (!state.enabled) return null
        const filePath = getBrowserLogFile()
        if (!filePath) return null
        if (state.browserLogFileReady) return filePath

        try {
            fs.mkdirSync(path.dirname(filePath), { recursive: true })
            if (fs.existsSync(filePath)) {
                try {
                    const existingContent = fs.readFileSync(filePath, 'utf8')
                    const existingLines = existingContent.split(/\r?\n/).filter((line) => line.length > 0)
                    const filteredLines = []
                    for (const line of existingLines) {
                        const parts = line.split('\t')
                        if (parts.length >= 2) {
                            const urlPart = parts[1]
                            if (shouldLogUrl && !shouldLogUrl(urlPart, rootUrl)) {
                                continue
                            }
                        }
                        filteredLines.push(`${line}\n`)
                        if (filteredLines.length > 100) {
                            filteredLines.shift()
                        }
                    }
                    state.browserLogBuffer = filteredLines
                    fs.writeFileSync(filePath, state.browserLogBuffer.join(''))
                } catch (err) {
                    console.error('[BROWSER LOG] Failed to prime existing browser log', err)
                    state.browserLogBuffer = []
                }
            }
            state.browserLogFileReady = true
            return filePath
        } catch (err) {
            console.error('[BROWSER LOG] Failed to prepare browser log file', err)
            return null
        }
    }

    /**
     * Clear console state for a webContents.
     * @param {WebContents} webContents - Electron webContents
     */
    const clearConsoleState = (webContents) => {
        if (state.consoleState.has(webContents)) {
            state.consoleState.delete(webContents)
        }
    }

    /**
     * Update console target for a webContents.
     * @param {WebContents} webContents - Electron webContents
     * @param {string} url - Current URL
     * @param {string} rootUrl - Root URL for comparison
     */
    const updateConsoleTarget = (webContents, url, rootUrl) => {
        if (!state.enabled || !rootUrl) {
            clearConsoleState(webContents)
            return
        }
        let parsed
        try {
            parsed = new URL(url)
        } catch (e) {
            clearConsoleState(webContents)
            return
        }
        if (parsed.origin !== rootUrl) {
            clearConsoleState(webContents)
            return
        }
        const existing = state.consoleState.get(webContents)
        if (existing && existing.url === parsed.href) {
            return
        }
        state.consoleState.set(webContents, { url: parsed.href })
    }

    return {
        safeParseUrl,
        resolveConsoleSourceUrl,
        getBrowserLogFile,
        ensureBrowserLogFile,
        clearConsoleState,
        updateConsoleTarget,
        consoleLevelLabels,
        isEnabled: () => state.enabled,
        getState: () => state
    }
}

module.exports = {
    createBrowserLogger
}
