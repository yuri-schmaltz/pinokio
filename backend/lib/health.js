/**
 * Health check and diagnostics module for Pinokio.
 * Provides system health monitoring and diagnostic endpoints.
 */

const os = require('os')
const { execSync } = require('child_process')

/**
 * Get system health metrics.
 * @returns {object} Health metrics
 */
const getHealthMetrics = () => {
    const uptime = process.uptime()
    const memory = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        memory: {
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
            external: Math.round(memory.external / 1024 / 1024),
            rss: Math.round(memory.rss / 1024 / 1024)
        },
        cpu: {
            user: Math.round(cpuUsage.user / 1000),
            system: Math.round(cpuUsage.system / 1000)
        },
        platform: {
            os: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version
        }
    }
}

/**
 * Check if a port is available.
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} True if available
 */
const isPortAvailable = async (port) => {
    return new Promise((resolve) => {
        const net = require('net')
        const server = net.createServer()
        server.listen(port, '127.0.0.1')
        server.on('listening', () => {
            server.close()
            resolve(true)
        })
        server.on('error', () => {
            resolve(false)
        })
    })
}

/**
 * Get diagnostic information.
 * @returns {object} Diagnostic info
 */
const getDiagnostics = () => {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        process: {
            pid: process.pid,
            cwd: process.cwd(),
            execPath: process.execPath,
            argv: process.argv
        },
        env: {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PINOKIO_TEST_MODE: process.env.PINOKIO_TEST_MODE || '0',
            PINOKIO_HARDEN_RENDERER: process.env.PINOKIO_HARDEN_RENDERER || '0',
            PINOKIO_BROWSER_LOG: process.env.PINOKIO_BROWSER_LOG || '0'
        },
        system: {
            hostname: os.hostname(),
            platform: os.platform(),
            release: os.release(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
            freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024)
        }
    }

    // Try to get git info
    try {
        diagnostics.git = {
            commit: execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(),
            branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
        }
    } catch {
        diagnostics.git = null
    }

    return diagnostics
}

/**
 * Perform startup checks.
 * @param {object} options - Check options
 * @param {number} options.port - Port to check
 * @returns {Promise<object>} Startup check results
 */
const performStartupChecks = async ({ port = 42000 } = {}) => {
    const results = {
        timestamp: new Date().toISOString(),
        checks: []
    }

    // Port check
    const portAvailable = await isPortAvailable(port)
    results.checks.push({
        name: 'port_available',
        passed: portAvailable,
        message: portAvailable ? `Port ${port} is available` : `Port ${port} is in use`,
        severity: portAvailable ? 'ok' : 'error'
    })

    // Memory check
    const freeMem = os.freemem()
    const minMem = 512 * 1024 * 1024 // 512MB
    const memOk = freeMem > minMem
    results.checks.push({
        name: 'memory_available',
        passed: memOk,
        message: memOk ? `${Math.round(freeMem / 1024 / 1024)}MB available` : 'Low memory warning',
        severity: memOk ? 'ok' : 'warning'
    })

    // Disk check (home directory)
    try {
        const homeDir = os.homedir()
        const fs = require('fs')
        fs.accessSync(homeDir, fs.constants.W_OK)
        results.checks.push({
            name: 'home_writable',
            passed: true,
            message: 'Home directory is writable',
            severity: 'ok'
        })
    } catch {
        results.checks.push({
            name: 'home_writable',
            passed: false,
            message: 'Home directory is not writable',
            severity: 'error'
        })
    }

    results.allPassed = results.checks.every(c => c.passed)
    return results
}

module.exports = {
    getHealthMetrics,
    isPortAvailable,
    getDiagnostics,
    performStartupChecks
}
