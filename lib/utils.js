/**
 * Utility functions shared across Pinokio modules.
 */

/**
 * Upsert a key-value pair in an object, matching case-insensitively.
 * @param {object} obj - Object to modify
 * @param {string} keyToChange - Key to upsert
 * @param {*} value - Value to set
 */
const upsertKeyValue = (obj, keyToChange, value) => {
    const keyToChangeLower = keyToChange.toLowerCase()
    for (const key of Object.keys(obj)) {
        if (key.toLowerCase() === keyToChangeLower) {
            obj[key] = value
            return
        }
    }
    obj[keyToChange] = value
}

/**
 * Get title bar overlay configuration based on platform.
 * @param {object} colors - Color configuration
 * @param {boolean} isMac - Whether running on macOS
 * @returns {object|false} Overlay config or false for macOS
 */
const titleBarOverlay = (colors, isMac = process.platform.startsWith('darwin')) => {
    if (isMac) {
        return false
    }
    return colors
}

module.exports = {
    upsertKeyValue,
    titleBarOverlay
}
