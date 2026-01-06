/**
 * Unit tests for lib/security.js module.
 */

const assert = require('assert')
const { generateCSP, sanitizeInput, validateUrl, checkCodeSecurity } = require('../../lib/security')

describe('security module', () => {
    describe('generateCSP', () => {
        it('generates default CSP', () => {
            const csp = generateCSP()
            assert.ok(csp.includes("default-src 'self'"))
            assert.ok(csp.includes("script-src 'self'"))
            assert.ok(csp.includes("object-src 'none'"))
        })

        it('allows inline scripts when configured', () => {
            const csp = generateCSP({ allowInlineScripts: true })
            assert.ok(csp.includes("'unsafe-inline'"))
        })

        it('allows eval when configured', () => {
            const csp = generateCSP({ allowEval: true })
            assert.ok(csp.includes("'unsafe-eval'"))
        })
    })

    describe('sanitizeInput', () => {
        it('escapes HTML entities', () => {
            assert.strictEqual(sanitizeInput('<script>'), '&lt;script&gt;')
            assert.strictEqual(sanitizeInput('"test"'), '&quot;test&quot;')
            assert.strictEqual(sanitizeInput("it's"), "it&#039;s")
        })

        it('handles non-string input', () => {
            assert.strictEqual(sanitizeInput(null), '')
            assert.strictEqual(sanitizeInput(123), '')
        })
    })

    describe('validateUrl', () => {
        it('allows file:// URLs by default', () => {
            assert.strictEqual(validateUrl('file:///path/to/file'), true)
        })

        it('validates against allowlist', () => {
            const allowed = ['https://example.com']
            assert.strictEqual(validateUrl('https://example.com/page', allowed), true)
            assert.strictEqual(validateUrl('https://malicious.com', allowed), false)
        })

        it('supports wildcard domains', () => {
            const allowed = ['*.example.com']
            assert.strictEqual(validateUrl('https://sub.example.com', allowed), true)
            assert.strictEqual(validateUrl('https://other.com', allowed), false)
        })

        it('returns false for invalid URLs', () => {
            assert.strictEqual(validateUrl('not-a-url', []), false)
            assert.strictEqual(validateUrl(null, []), false)
        })
    })

    describe('checkCodeSecurity', () => {
        it('detects eval usage', () => {
            const findings = checkCodeSecurity('const x = eval(code)')
            assert.ok(findings.some(f => f.message.includes('eval')))
        })

        it('detects disabled context isolation', () => {
            const findings = checkCodeSecurity('contextIsolation: false')
            assert.ok(findings.some(f => f.message.includes('Context isolation')))
        })

        it('returns empty for clean code', () => {
            const findings = checkCodeSecurity('const x = 1 + 2')
            assert.strictEqual(findings.length, 0)
        })
    })
})
