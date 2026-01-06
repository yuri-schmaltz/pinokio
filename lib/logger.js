/**
 * Structured logging module for Pinokio.
 * Provides consistent log format with levels, timestamps, and context.
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
}

/**
 * Create a structured logger instance.
 * @param {object} options - Logger options
 * @param {string} options.name - Logger name/component
 * @param {string} options.logDir - Directory for log files
 * @param {number} options.minLevel - Minimum log level (default: INFO)
 * @param {boolean} options.enableFile - Enable file logging
 * @returns {object} Logger instance
 */
const createLogger = ({ name = 'pinokio', logDir = null, minLevel = LOG_LEVELS.INFO, enableFile = false } = {}) => {
    let logFilePath = null
    let logFileReady = false

    const formatTimestamp = () => {
        return new Date().toISOString()
    }

    const formatMessage = (level, message, context = {}) => {
        const entry = {
            timestamp: formatTimestamp(),
            level,
            component: name,
            message,
            ...context
        }
        return JSON.stringify(entry)
    }

    const writeToFile = (formatted) => {
        if (!enableFile || !logFilePath) return
        try {
            fs.appendFileSync(logFilePath, formatted + '\n')
        } catch (err) {
            // Silently fail file writes
        }
    }

    const initLogFile = (dir) => {
        if (logFileReady) return
        try {
            const targetDir = dir || logDir || path.join(os.homedir(), '.pinokio', 'logs')
            fs.mkdirSync(targetDir, { recursive: true })
            logFilePath = path.join(targetDir, `${name}.log`)
            logFileReady = true
        } catch (err) {
            console.error(`[Logger] Failed to init log file: ${err.message}`)
        }
    }

    const log = (level, levelName, message, context = {}) => {
        if (level < minLevel) return
        const formatted = formatMessage(levelName, message, context)

        // Console output
        const consoleMethod = levelName === 'ERROR' ? console.error :
            levelName === 'WARN' ? console.warn :
                levelName === 'DEBUG' ? console.debug : console.log
        consoleMethod(`[${name}] ${message}`, context)

        // File output
        if (enableFile) {
            initLogFile()
            writeToFile(formatted)
        }
    }

    return {
        debug: (message, context) => log(LOG_LEVELS.DEBUG, 'DEBUG', message, context),
        info: (message, context) => log(LOG_LEVELS.INFO, 'INFO', message, context),
        warn: (message, context) => log(LOG_LEVELS.WARN, 'WARN', message, context),
        error: (message, context) => log(LOG_LEVELS.ERROR, 'ERROR', message, context),
        setLogDir: (dir) => { logDir = dir; logFileReady = false },
        LOG_LEVELS
    }
}

// Default logger instance
const defaultLogger = createLogger({ name: 'pinokio' })

module.exports = {
    createLogger,
    LOG_LEVELS,
    // Default logger methods
    debug: defaultLogger.debug,
    info: defaultLogger.info,
    warn: defaultLogger.warn,
    error: defaultLogger.error
}
