/**
 * Unit tests for lib/health.js module.
 */

const assert = require('assert')
const { getHealthMetrics, isPortAvailable, getDiagnostics, performStartupChecks } = require('../../lib/health')

describe('health module', () => {
    describe('getHealthMetrics', () => {
        it('returns health metrics object', () => {
            const metrics = getHealthMetrics()
            assert.strictEqual(metrics.status, 'healthy')
            assert.ok(metrics.timestamp)
            assert.ok(typeof metrics.uptime === 'number')
            assert.ok(metrics.memory)
            assert.ok(metrics.memory.heapUsed)
            assert.ok(metrics.platform)
        })
    })

    describe('isPortAvailable', () => {
        it('returns boolean for port check', async () => {
            const result = await isPortAvailable(59999)
            assert.strictEqual(typeof result, 'boolean')
        })
    })

    describe('getDiagnostics', () => {
        it('returns diagnostic information', () => {
            const diag = getDiagnostics()
            assert.ok(diag.timestamp)
            assert.ok(diag.process)
            assert.ok(diag.process.pid)
            assert.ok(diag.env)
            assert.ok(diag.system)
            assert.ok(diag.system.platform)
        })
    })

    describe('performStartupChecks', () => {
        it('returns startup check results', async () => {
            const results = await performStartupChecks({ port: 59998 })
            assert.ok(results.timestamp)
            assert.ok(Array.isArray(results.checks))
            assert.ok(results.checks.length > 0)
            assert.ok(typeof results.allPassed === 'boolean')
        })
    })
})
