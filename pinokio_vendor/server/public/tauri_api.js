/**
 * Tauri API Wrapper
 * Encapsulates Tauri native APIs with feature detection and fallbacks.
 * @module tauri_api
 */

const TauriAPI = (function () {
    'use strict';

    /**
     * Check if running inside Tauri environment
     * @returns {boolean}
     */
    function isTauri() {
        return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    }

    /**
     * Get Tauri API module (lazy load)
     * @returns {object|null}
     */
    function getTauriWindow() {
        if (!isTauri()) return null;
        try {
            return window.__TAURI__.window;
        } catch (e) {
            console.warn('[TauriAPI] Could not access window API:', e);
            return null;
        }
    }

    /**
     * Open a new Tauri WebviewWindow
     * @param {string} label - Unique window label
     * @param {string} url - URL to load
     * @param {object} options - Window options (title, width, height, etc.)
     * @returns {Promise<object|null>}
     */
    async function openWindow(label, url, options = {}) {
        const windowApi = getTauriWindow();
        if (!windowApi) {
            console.warn('[TauriAPI] Not in Tauri environment, using window.open fallback');
            window.open(url, label, 'width=1200,height=800');
            return null;
        }

        try {
            const { WebviewWindow } = windowApi;
            const webview = new WebviewWindow(label, {
                url: url,
                title: options.title || 'Pinokio',
                width: options.width || 1200,
                height: options.height || 800,
                center: options.center !== false,
                decorations: options.decorations !== false,
                resizable: options.resizable !== false,
                ...options
            });

            webview.once('tauri://created', () => {
                console.log('[TauriAPI] Window created:', label);
            });

            webview.once('tauri://error', (e) => {
                console.error('[TauriAPI] Window creation failed:', e);
            });

            return webview;
        } catch (e) {
            console.error('[TauriAPI] Error opening window:', e);
            window.open(url, label, 'width=1200,height=800');
            return null;
        }
    }

    /**
     * Close the current window
     * @returns {Promise<void>}
     */
    async function closeWindow() {
        const windowApi = getTauriWindow();
        if (!windowApi) {
            console.warn('[TauriAPI] Not in Tauri, using window.close fallback');
            window.close();
            return;
        }

        try {
            const { getCurrent } = windowApi;
            const currentWindow = getCurrent();
            await currentWindow.close();
        } catch (e) {
            console.error('[TauriAPI] Error closing window:', e);
            window.close();
        }
    }

    /**
     * Minimize the current window
     * @returns {Promise<void>}
     */
    async function minimizeWindow() {
        const windowApi = getTauriWindow();
        if (!windowApi) return;

        try {
            const { getCurrent } = windowApi;
            const currentWindow = getCurrent();
            await currentWindow.minimize();
        } catch (e) {
            console.error('[TauriAPI] Error minimizing window:', e);
        }
    }

    /**
     * Toggle fullscreen state
     * @returns {Promise<void>}
     */
    async function toggleFullscreen() {
        const windowApi = getTauriWindow();
        if (!windowApi) {
            // Fallback to browser fullscreen API
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
            return;
        }

        try {
            const { getCurrent } = windowApi;
            const currentWindow = getCurrent();
            const isFullscreen = await currentWindow.isFullscreen();
            await currentWindow.setFullscreen(!isFullscreen);
        } catch (e) {
            console.error('[TauriAPI] Error toggling fullscreen:', e);
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>}
     */
    async function copyToClipboard(text) {
        if (isTauri() && window.__TAURI__.clipboard) {
            try {
                await window.__TAURI__.clipboard.writeText(text);
                return true;
            } catch (e) {
                console.error('[TauriAPI] Clipboard error:', e);
            }
        }

        // Browser fallback
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            console.error('[TauriAPI] Browser clipboard error:', e);
            return false;
        }
    }

    /**
     * Show a native notification
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @returns {Promise<void>}
     */
    async function showNotification(title, body) {
        if (isTauri() && window.__TAURI__.notification) {
            try {
                const { sendNotification, isPermissionGranted, requestPermission } = window.__TAURI__.notification;
                let permissionGranted = await isPermissionGranted();
                if (!permissionGranted) {
                    const permission = await requestPermission();
                    permissionGranted = permission === 'granted';
                }
                if (permissionGranted) {
                    sendNotification({ title, body });
                    return;
                }
            } catch (e) {
                console.error('[TauriAPI] Notification error:', e);
            }
        }

        // Browser fallback
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, { body });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            }
        }
    }

    // Expose public API
    return {
        isTauri,
        openWindow,
        closeWindow,
        minimizeWindow,
        toggleFullscreen,
        copyToClipboard,
        showNotification
    };
})();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TauriAPI;
}
