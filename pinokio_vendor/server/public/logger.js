/**
 * Pinokio Logger Service
 * Structured logging with levels and performance metrics.
 * @module logger
 */

const Logger = (function () {
    'use strict';

    const LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    // Default to INFO in production, DEBUG in development
    let currentLevel = LOG_LEVELS.INFO;

    // Performance marks storage
    const marks = new Map();

    /**
     * Set the minimum log level
     * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'} level
     */
    function setLevel(level) {
        if (LOG_LEVELS[level] !== undefined) {
            currentLevel = LOG_LEVELS[level];
        }
    }

    /**
     * Format log message with timestamp and context
     * @param {string} level
     * @param {string} message
     * @param {object} context
     * @returns {string}
     */
    function formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level}] ${message}${contextStr}`;
    }

    /**
     * Log a debug message
     * @param {string} message
     * @param {object} [context]
     */
    function debug(message, context) {
        if (currentLevel <= LOG_LEVELS.DEBUG) {
            console.debug(formatMessage('DEBUG', message, context));
        }
    }

    /**
     * Log an info message
     * @param {string} message
     * @param {object} [context]
     */
    function info(message, context) {
        if (currentLevel <= LOG_LEVELS.INFO) {
            console.info(formatMessage('INFO', message, context));
        }
    }

    /**
     * Log a warning message
     * @param {string} message
     * @param {object} [context]
     */
    function warn(message, context) {
        if (currentLevel <= LOG_LEVELS.WARN) {
            console.warn(formatMessage('WARN', message, context));
        }
    }

    /**
     * Log an error message
     * @param {string} message
     * @param {Error|object} [errorOrContext]
     */
    function error(message, errorOrContext) {
        if (currentLevel <= LOG_LEVELS.ERROR) {
            const context = errorOrContext instanceof Error
                ? { error: errorOrContext.message, stack: errorOrContext.stack }
                : errorOrContext;
            console.error(formatMessage('ERROR', message, context));
        }
    }

    /**
     * Start a performance measurement
     * @param {string} name - Unique name for this measurement
     */
    function markStart(name) {
        if (typeof performance !== 'undefined' && performance.mark) {
            const markName = `pinokio_${name}_start`;
            performance.mark(markName);
            marks.set(name, markName);
        }
    }

    /**
     * End a performance measurement and log the duration
     * @param {string} name - Name used in markStart
     * @returns {number|null} Duration in milliseconds
     */
    function markEnd(name) {
        if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
            const startMark = marks.get(name);
            if (!startMark) {
                warn(`Performance mark not found: ${name}`);
                return null;
            }

            const endMark = `pinokio_${name}_end`;
            const measureName = `pinokio_${name}`;

            try {
                performance.mark(endMark);
                performance.measure(measureName, startMark, endMark);

                const entries = performance.getEntriesByName(measureName);
                if (entries.length > 0) {
                    const duration = entries[0].duration;
                    debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });

                    // Cleanup
                    performance.clearMarks(startMark);
                    performance.clearMarks(endMark);
                    performance.clearMeasures(measureName);
                    marks.delete(name);

                    return duration;
                }
            } catch (e) {
                warn('Performance measurement failed', { name, error: e.message });
            }
        }
        return null;
    }

    /**
     * Log Core Web Vitals if available
     */
    function logWebVitals() {
        if (typeof PerformanceObserver === 'undefined') return;

        try {
            // Largest Contentful Paint
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                info('LCP', { value: `${lastEntry.startTime.toFixed(2)}ms` });
            }).observe({ type: 'largest-contentful-paint', buffered: true });

            // First Input Delay (approximation via first-input)
            new PerformanceObserver((entryList) => {
                const firstInput = entryList.getEntries()[0];
                if (firstInput) {
                    info('FID', { value: `${firstInput.processingStart - firstInput.startTime}ms` });
                }
            }).observe({ type: 'first-input', buffered: true });

            // Cumulative Layout Shift
            new PerformanceObserver((entryList) => {
                let clsValue = 0;
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                info('CLS', { value: clsValue.toFixed(4) });
            }).observe({ type: 'layout-shift', buffered: true });

        } catch (e) {
            debug('Web Vitals observation not supported', { error: e.message });
        }
    }

    // Expose public API
    return {
        setLevel,
        debug,
        info,
        warn,
        error,
        markStart,
        markEnd,
        logWebVitals,
        LOG_LEVELS
    };
})();

// Auto-initialize web vitals logging on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        Logger.logWebVitals();
    });
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
