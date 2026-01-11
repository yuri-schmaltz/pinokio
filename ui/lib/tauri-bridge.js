/**
 * Pinokio Tauri Bridge
 * 
 * This module acts as a bridge between the frontend and the Tauri Rust backend.
 * It provides a consistent API for terminal, filesystem, and process management.
 */

const isTauri = () => !!(window && window.__TAURI_IPC__);

/**
 * Invoke a Tauri command.
 */
async function invoke(cmd, args = {}) {
    if (isTauri()) {
        const { invoke: tauriInvoke } = window.__TAURI__.tauri;
        return tauriInvoke(cmd, args);
    }
    console.warn(`[Tauri Bridge] Command "${cmd}" called outside Tauri context.`);
    return null;
}

/**
 * Listen for a Tauri event.
 */
async function listen(event, callback) {
    if (isTauri()) {
        const { listen: tauriListen } = window.__TAURI__.event;
        return tauriListen(event, callback);
    }
    console.warn(`[Tauri Bridge] Listener for "${event}" registered outside Tauri context.`);
    return () => { };
}

// ===== Terminal Commands =====

/**
 * Run a command in the terminal.
 */
async function runCommand(cmd, args = [], cwd = null, onStdout = null, onStderr = null) {
    const windowId = `win_${Math.random().toString(36).slice(2, 9)}`;

    const subscribe = async (eventName, handler) => {
        try {
            return await listen(eventName, (e) => handler(e.payload ?? e));
        } catch (_) {
            return () => {};
        }
    };

    if (onStdout) {
        await subscribe(`terminal:stdout:${windowId}`, onStdout);
        await subscribe('terminal:stdout', onStdout);
    }
    if (onStderr) {
        await subscribe(`terminal:stderr:${windowId}`, onStderr);
        await subscribe('terminal:stderr', onStderr);
    }

    return invoke('run_command', { cmd, args, cwd, windowId });
}

/**
 * Kill a process.
 */
async function killProcess(pid) {
    return invoke('kill_process', { pid });
}

// ===== Filesystem Commands =====

async function listDirectory(path) {
    return invoke('list_directory', { path });
}

async function readFile(path) {
    return invoke('read_file', { path });
}

async function writeFile(path, content) {
    return invoke('write_file', { path, content });
}

async function pathExists(path) {
    return invoke('path_exists', { path });
}

async function getHomeDir() {
    return invoke('get_home_dir', {});
}

async function createDir(path) {
    return invoke('create_dir', { path });
}

async function removePath(path, recursive = false) {
    return invoke('remove_path', { path, recursive });
}

// ===== Process & System Commands =====

async function getProcesses() {
    return invoke('get_processes', {});
}

async function detectConda() {
    return invoke('detect_conda', {});
}

async function getSystemResources() {
    return invoke('get_system_resources', {});
}

// ===== Electron Compatibility Shim =====

const electronAPI = {
    send: (type, msg) => invoke(type, msg),
    invoke: (type, msg) => invoke(type, msg),
    startInspector: (payload) => invoke('start_inspector', payload || {}),
    stopInspector: () => invoke('stop_inspector'),
    captureScreenshot: (screenshotRequest) => invoke('capture_screenshot', { screenshotRequest })
};

// Export for use in browser context
if (typeof window !== 'undefined') {
    window.tauriBridge = {
        isTauri,
        invoke,
        listen,
        runCommand,
        killProcess,
        listDirectory,
        readFile,
        writeFile,
        pathExists,
        getHomeDir,
        createDir,
        removePath,
        getProcesses,
        detectConda,
        getSystemResources,
        electronAPI
    };

    // Auto-inject if in Tauri but legacy code expects electronAPI
    if (isTauri() && !window.electronAPI) {
        window.electronAPI = electronAPI;
    }
}

// Export for module context
if (typeof module !== 'undefined' && module && module.exports) {
    module.exports = {
        isTauri,
        invoke,
        listen,
        runCommand,
        killProcess,
        listDirectory,
        readFile,
        writeFile,
        pathExists,
        getHomeDir,
        createDir,
        removePath,
        getProcesses,
        detectConda,
        getSystemResources,
        electronAPI
    };
}
