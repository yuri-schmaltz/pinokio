/**
 * Element Inspector module for Pinokio.
 * Handles frame selection, DOM inspection, and screenshot capture.
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// Module state
const inspectorSessions = new Map()
const inspectorLogFile = path.join(os.tmpdir(), 'pinokio-inspector.log')

/**
 * Log inspector events to file and stdout.
 * @param {string} label - Log label
 * @param {object} payload - Log payload
 */
const inspectorMainLog = (label, payload) => {
    try {
        const serialized = payload === undefined ? '' : ' ' + JSON.stringify(payload)
        const line = `[InspectorMain] ${label}${serialized}\n`
        try {
            fs.appendFileSync(inspectorLogFile, line)
        } catch (_) { }
        process.stdout.write(line)
    } catch (_) {
        try {
            fs.appendFileSync(inspectorLogFile, `[InspectorMain] ${label}\n`)
        } catch (_) { }
        process.stdout.write(`[InspectorMain] ${label}\n`)
    }
}

/**
 * Normalize a URL for comparison.
 * @param {string} value - URL to normalize
 * @returns {string|null} Normalized URL or null
 */
const normalizeInspectorUrl = (value) => {
    if (!value) return null
    try {
        return new URL(value).href
    } catch (_) {
        return value
    }
}

/**
 * Check if two URLs roughly match.
 * @param {string} expected - Expected URL
 * @param {string} candidate - Candidate URL
 * @returns {boolean} True if they roughly match
 */
const urlsRoughlyMatch = (expected, candidate) => {
    if (!expected) return true
    if (!candidate) return false
    if (candidate === expected) return true
    return candidate.startsWith(expected) || expected.startsWith(candidate)
}

/**
 * Flatten a frame tree into an array.
 * @param {Frame} frame - Root frame
 * @param {Array} acc - Accumulator array
 * @param {number} depth - Current depth
 * @returns {Array} Flattened frames
 */
const flattenFrameTree = (frame, acc = [], depth = 0) => {
    if (!frame) return acc
    let frameName = null
    try {
        frameName = typeof frame.name === 'string' && frame.name.length ? frame.name : null
    } catch (_) {
        frameName = null
    }
    acc.push({ frame, depth, url: normalizeInspectorUrl(frame.url || ''), name: frameName })
    const children = Array.isArray(frame.frames) ? frame.frames : []
    for (const child of children) {
        flattenFrameTree(child, acc, depth + 1)
    }
    return acc
}

/**
 * Find a descendant frame by URL.
 * @param {Frame} frame - Root frame
 * @param {string} targetUrl - Target URL to find
 * @returns {Frame|null} Found frame or null
 */
const findDescendantByUrl = (frame, targetUrl) => {
    if (!frame || !targetUrl) return null
    const normalizedTarget = normalizeInspectorUrl(targetUrl)
    if (!normalizedTarget) return null
    const stack = [frame]
    while (stack.length) {
        const current = stack.pop()
        try {
            const currentUrl = normalizeInspectorUrl(current.url || '')
            if (currentUrl && urlsRoughlyMatch(normalizedTarget, currentUrl)) {
                return current
            }
        } catch (_) { }
        const children = Array.isArray(current.frames) ? current.frames : []
        for (const child of children) {
            if (child) stack.push(child)
        }
    }
    return null
}

/**
 * Select the target frame for inspection.
 * @param {WebContents} webContents - Electron webContents
 * @param {object} payload - Selection options
 * @returns {Frame|null} Selected frame or null
 */
const selectTargetFrame = (webContents, payload = {}) => {
    if (!webContents || !webContents.mainFrame) {
        inspectorMainLog('no-webcontents', {})
        return null
    }
    const frames = flattenFrameTree(webContents.mainFrame, [])
    if (!frames.length) {
        inspectorMainLog('no-frames', { webContentsId: webContents.id })
        return null
    }
    inspectorMainLog('incoming', {
        frameUrl: payload.frameUrl || null,
        frameName: payload.frameName || null,
        frameNodeId: payload.frameNodeId || null,
        frameCount: frames.length,
    })

    const canonicalUrl = normalizeInspectorUrl(payload.frameUrl)
    const relativeOrdinal = typeof payload.candidateRelativeOrdinal === 'number' ? payload.candidateRelativeOrdinal : null
    const globalOrdinal = typeof payload.frameIndex === 'number' ? payload.frameIndex : null
    const canonicalFrameName = typeof payload.frameName === 'string' && payload.frameName.trim() ? payload.frameName.trim() : null
    const canonicalFrameNodeId = typeof payload.frameNodeId === 'string' && payload.frameNodeId.trim() ? payload.frameNodeId.trim() : null

    // Try identifier-based matching first
    if (canonicalFrameName || canonicalFrameNodeId) {
        inspectorMainLog('identifier-search', {
            frameName: canonicalFrameName || null,
            frameNodeId: canonicalFrameNodeId || null,
            names: frames.map((entry) => entry.name || null).slice(0, 12),
        })

        let identifierMatch = null
        if (canonicalFrameNodeId) {
            identifierMatch = frames.find((entry) => entry && entry.name === canonicalFrameNodeId) || null
            if (identifierMatch) {
                const normalizedUrl = normalizeInspectorUrl(identifierMatch.url || '')
                if (canonicalUrl && (!normalizedUrl || !urlsRoughlyMatch(canonicalUrl, normalizedUrl))) {
                    const descendant = findDescendantByUrl(identifierMatch.frame, canonicalUrl)
                    if (descendant) {
                        inspectorMainLog('identifier-match-node-descendant', {
                            index: frames.indexOf(identifierMatch),
                            name: identifierMatch.name || null,
                            url: identifierMatch.url || null,
                            descendantUrl: normalizeInspectorUrl(descendant.url || ''),
                        })
                        return descendant
                    }
                }
                inspectorMainLog('identifier-match-node', {
                    index: frames.indexOf(identifierMatch),
                    name: identifierMatch.name || null,
                    url: identifierMatch.url || null,
                })
                return identifierMatch.frame
            }
        }

        if (canonicalFrameName) {
            identifierMatch = frames.find((entry) => entry && entry.name === canonicalFrameName) || null
            if (identifierMatch) {
                const normalizedUrl = normalizeInspectorUrl(identifierMatch.url || '')
                if (canonicalUrl && (!normalizedUrl || !urlsRoughlyMatch(canonicalUrl, normalizedUrl))) {
                    const descendant = findDescendantByUrl(identifierMatch.frame, canonicalUrl)
                    if (descendant) {
                        inspectorMainLog('identifier-match-name-descendant', {
                            index: frames.indexOf(identifierMatch),
                            name: identifierMatch.name || null,
                            url: identifierMatch.url || null,
                            descendantUrl: normalizeInspectorUrl(descendant.url || ''),
                        })
                        return descendant
                    }
                }
                inspectorMainLog('identifier-match-name', {
                    index: frames.indexOf(identifierMatch),
                    name: identifierMatch.name || null,
                    url: identifierMatch.url || null,
                })
                return identifierMatch.frame
            }
        }

        inspectorMainLog('identifier-miss', {})
    }

    // URL-based matching
    let matches = frames
    if (canonicalUrl) {
        matches = frames.filter(({ url }) => urlsRoughlyMatch(canonicalUrl, url))
    }

    if (matches.length) {
        if (relativeOrdinal !== null) {
            const filtered = matches.slice().sort((a, b) => a.depth - b.depth || frames.indexOf(a) - frames.indexOf(b))
            const targetEntry = filtered[Math.min(Math.max(relativeOrdinal, 0), filtered.length - 1)]
            if (targetEntry) {
                inspectorMainLog('relative-ordinal-match', {
                    index: frames.indexOf(targetEntry),
                    name: targetEntry.name || null,
                    url: targetEntry.url || null,
                })
                return targetEntry.frame
            }
        }
        const fallbackEntry = matches[0]
        if (fallbackEntry) {
            inspectorMainLog('fallback-match', {
                index: frames.indexOf(fallbackEntry),
                name: fallbackEntry.name || null,
                url: fallbackEntry.url || null,
            })
            return fallbackEntry.frame
        }
    }

    if (globalOrdinal !== null && frames[globalOrdinal]) {
        inspectorMainLog('global-ordinal-match', {
            index: globalOrdinal,
            name: frames[globalOrdinal].name || null,
            url: frames[globalOrdinal].url || null,
        })
        return frames[globalOrdinal].frame
    }

    inspectorMainLog('default-match', {
        name: frames[0]?.name || null,
        url: frames[0]?.url || null,
    })

    return frames[0]?.frame || null
}

/**
 * Build the inspector injection script.
 * @returns {string} JavaScript code to inject
 */
const buildInspectorInjection = () => {
    const source = function () {
        try {
            if (window.__PINOKIO_INSPECTOR__ && typeof window.__PINOKIO_INSPECTOR__.stop === 'function') {
                window.__PINOKIO_INSPECTOR__.stop()
            }

            const overlay = document.createElement('div')
            overlay.style.position = 'fixed'
            overlay.style.pointerEvents = 'none'
            overlay.style.border = '2px solid rgba(77,163,255,0.9)'
            overlay.style.background = 'rgba(77,163,255,0.2)'
            overlay.style.boxShadow = '0 0 0 1px rgba(23,52,92,0.45)'
            overlay.style.zIndex = '2147483647'
            overlay.style.display = 'none'
            document.documentElement.appendChild(overlay)

            let active = true

            const post = (type, payload) => {
                try {
                    window.parent.postMessage({ pinokioInspector: { type, frameUrl: window.location.href, ...payload } }, '*')
                } catch (err) {
                    // ignore
                }
            }

            const updateBox = (target) => {
                if (!active || !target) {
                    overlay.style.display = 'none'
                    return
                }
                const rect = target.getBoundingClientRect()
                if (!rect || rect.width <= 0 || rect.height <= 0) {
                    overlay.style.display = 'none'
                    return
                }
                overlay.style.display = 'block'
                overlay.style.left = `${rect.left}px`
                overlay.style.top = `${rect.top}px`
                overlay.style.width = `${rect.width}px`
                overlay.style.height = `${rect.height}px`
            }

            const buildPathKeys = (node) => {
                if (!node) return []
                const keys = []
                let current = node
                let depth = 0
                while (current && current.nodeType === Node.ELEMENT_NODE && depth < 8) {
                    const tag = current.tagName ? current.tagName.toLowerCase() : 'element'
                    let descriptor = tag
                    if (current.id) {
                        descriptor += `#${current.id}`
                    } else if (current.classList && current.classList.length) {
                        descriptor += `.${Array.from(current.classList).slice(0, 2).join('.')}`
                    }
                    keys.push(descriptor)
                    current = current.parentElement
                    depth += 1
                }
                return keys.reverse()
            }

            const handleMove = (event) => {
                if (!active) return
                const target = event.target
                updateBox(target)
                post('update', {
                    nodeName: target && target.tagName ? target.tagName.toLowerCase() : '',
                    pathKeys: buildPathKeys(target),
                })
            }

            const preventClick = (event) => {
                if (!active) return
                event.preventDefault()
                event.stopPropagation()
            }

            const handleClick = async (event) => {
                if (!active) return
                event.preventDefault()
                event.stopPropagation()

                const target = event.target
                const html = target && target.outerHTML ? target.outerHTML : ''
                let screenshot = null

                if (overlay && overlay.style) {
                    overlay.style.display = 'none'
                }

                await new Promise(resolve => setTimeout(resolve, 50))

                try {
                    const rect = target.getBoundingClientRect()
                    const screenshotRequest = {
                        type: 'screenshot',
                        bounds: {
                            x: Math.round(rect.left),
                            y: Math.round(rect.top),
                            width: Math.max(1, Math.round(rect.width)),
                            height: Math.max(1, Math.round(rect.height))
                        },
                        devicePixelRatio: window.devicePixelRatio || 1,
                        frameUrl: window.location.href,
                        __pinokioRelayStage: 0,
                        __pinokioRelayComplete: window === window.top
                    }

                    try {
                        const response = await new Promise((resolve, reject) => {
                            const messageId = 'screenshot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

                            const handleResponse = (event) => {
                                if (event.data && event.data.pinokioScreenshotResponse && event.data.messageId === messageId) {
                                    window.removeEventListener('message', handleResponse)
                                    if (event.data.success) {
                                        resolve(event.data.screenshot)
                                    } else {
                                        reject(new Error(event.data.error || 'Screenshot failed'))
                                    }
                                }
                            }

                            window.addEventListener('message', handleResponse)
                            window.parent.postMessage({
                                pinokioScreenshotRequest: screenshotRequest,
                                messageId: messageId
                            }, '*')

                            setTimeout(() => {
                                window.removeEventListener('message', handleResponse)
                                reject(new Error('Screenshot timeout'))
                            }, 3000)
                        })

                        screenshot = response
                    } catch (screenshotError) {
                        screenshot = null
                    }
                } catch (error) {
                    screenshot = null
                }

                post('complete', {
                    outerHTML: html,
                    pathKeys: buildPathKeys(target),
                    screenshot: screenshot
                })
                stop()
            }

            const handleKey = (event) => {
                if (!active) return
                if (event.key === 'Escape') {
                    post('cancelled', {})
                    stop()
                }
            }

            const stop = () => {
                if (!active) return
                active = false
                document.removeEventListener('mousemove', handleMove, true)
                document.removeEventListener('mouseover', handleMove, true)
                document.removeEventListener('mousedown', preventClick, true)
                document.removeEventListener('click', handleClick, true)
                window.removeEventListener('keydown', handleKey, true)
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay)
                }
                window.__PINOKIO_INSPECTOR__ = null
            }

            document.addEventListener('mousemove', handleMove, true)
            document.addEventListener('mouseover', handleMove, true)
            document.addEventListener('mousedown', preventClick, true)
            document.addEventListener('click', handleClick, true)
            window.addEventListener('keydown', handleKey, true)

            window.__PINOKIO_INSPECTOR__ = { stop }
            post('started', {})
        } catch (error) {
            try {
                window.parent.postMessage({ pinokioInspector: { type: 'error', frameUrl: window.location.href, message: error && error.message ? error.message : String(error) } }, '*')
            } catch (_) { }
        }
    }
    return `(${source.toString()})();`
}

/**
 * Install screenshot relays in all frames.
 * @param {Frame} frame - Root frame
 * @param {function} buildScreenshotRelayInjection - Injection builder function
 */
const installScreenshotRelays = async (frame, buildScreenshotRelayInjection) => {
    if (!frame) return
    const topFrame = frame.top || frame
    const frames = flattenFrameTree(topFrame, [])
    for (const entry of frames) {
        const candidate = entry && entry.frame
        if (!candidate || (candidate.isDestroyed && candidate.isDestroyed())) {
            continue
        }
        try {
            await candidate.executeJavaScript(buildScreenshotRelayInjection(), true)
        } catch (error) {
            console.warn('Screenshot relay injection failed:', error && error.message ? error.message : error)
        }
    }
}

/**
 * Start an inspector session.
 * @param {WebContents} webContents - Electron webContents
 * @param {object} payload - Session options
 * @param {function} buildScreenshotRelayInjection - Screenshot relay builder
 * @returns {object} Session info
 */
const startInspectorSession = async (webContents, payload = {}, buildScreenshotRelayInjection) => {
    const existing = inspectorSessions.get(webContents.id)
    if (existing) {
        await stopInspectorSession(webContents)
    }

    const targetFrame = selectTargetFrame(webContents, payload)
    if (!targetFrame) {
        throw new Error('Unable to locate iframe to inspect.')
    }

    if (buildScreenshotRelayInjection) {
        await installScreenshotRelays(targetFrame, buildScreenshotRelayInjection)
    }
    await targetFrame.executeJavaScript(buildInspectorInjection(), true)

    const navigationHandler = () => {
        const resultPromise = stopInspectorSession(webContents)
        Promise.resolve(resultPromise).then((outcome) => {
            if (!webContents.isDestroyed()) {
                webContents.send('pinokio:inspector-cancelled', { frameUrl: (outcome && outcome.frameUrl) || targetFrame.url || payload.frameUrl || '' })
            }
        })
    }

    if (!webContents.isDestroyed()) {
        webContents.on('did-navigate', navigationHandler)
        webContents.on('did-navigate-in-page', navigationHandler)
    }

    inspectorSessions.set(webContents.id, {
        frame: targetFrame,
        navigationHandler,
    })

    return { frameUrl: targetFrame.url || payload.frameUrl || '' }
}

/**
 * Stop an inspector session.
 * @param {WebContents} webContents - Electron webContents
 * @returns {object} Session end info
 */
const stopInspectorSession = async (webContents) => {
    const session = inspectorSessions.get(webContents.id)
    if (!session) {
        return { frameUrl: '' }
    }
    inspectorSessions.delete(webContents.id)
    if (session.navigationHandler && !webContents.isDestroyed()) {
        webContents.removeListener('did-navigate', session.navigationHandler)
        webContents.removeListener('did-navigate-in-page', session.navigationHandler)
    }
    const frameUrl = session.frame && session.frame.url ? session.frame.url : ''
    try {
        await session.frame.executeJavaScript('window.__PINOKIO_INSPECTOR__ && window.__PINOKIO_INSPECTOR__.stop()', true)
    } catch (_) { }
    return { frameUrl }
}

/**
 * Get inspector sessions map.
 * @returns {Map} Sessions map
 */
const getInspectorSessions = () => inspectorSessions

module.exports = {
    inspectorMainLog,
    normalizeInspectorUrl,
    urlsRoughlyMatch,
    flattenFrameTree,
    findDescendantByUrl,
    selectTargetFrame,
    buildInspectorInjection,
    installScreenshotRelays,
    startInspectorSession,
    stopInspectorSession,
    getInspectorSessions,
    inspectorLogFile
}
