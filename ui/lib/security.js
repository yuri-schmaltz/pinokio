/**
 * Security hardening utilities for Pinokio.
 * Provides CSP generation, input sanitization, and security checks.
 */

/**
 * Generate a Content Security Policy for HTML pages.
 * @param {object} options - CSP options
 * @param {boolean} options.allowInlineScripts - Allow inline scripts (default: false)
 * @param {boolean} options.allowEval - Allow eval (default: false)
 * @param {string[]} options.scriptSrc - Additional script sources
 * @param {string[]} options.styleSrc - Additional style sources
 * @returns {string} CSP header value
 */
const generateCSP = ({
    allowInlineScripts = false,
    allowEval = false,
    scriptSrc = [],
    styleSrc = []
} = {}) => {
    const directives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", ...scriptSrc],
        'style-src': ["'self'", "'unsafe-inline'", ...styleSrc],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
        'frame-src': ["'self'", 'http:', 'https:'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"]
    }

    if (allowInlineScripts) {
        directives['script-src'].push("'unsafe-inline'")
    }
    if (allowEval) {
        directives['script-src'].push("'unsafe-eval'")
    }

    return Object.entries(directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ')
}

/**
 * Sanitize user input for safe display.
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return ''
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Validate URL against allowlist patterns.
 * @param {string} url - URL to validate
 * @param {string[]} allowedOrigins - Allowed origin patterns
 * @returns {boolean} True if URL is allowed
 */
const validateUrl = (url, allowedOrigins = []) => {
    if (!url) return false
    try {
        const parsed = new URL(url)
        // Always allow file:// for local content
        if (parsed.protocol === 'file:') return true
        // Check against allowlist
        return allowedOrigins.some(origin => {
            if (origin === '*') return true
            if (origin.startsWith('*.')) {
                const domain = origin.slice(2)
                return parsed.hostname.endsWith(domain)
            }
            return parsed.origin === origin
        })
    } catch {
        return false
    }
}

/**
 * Check for common security vulnerabilities in code.
 * @param {string} code - Code to check
 * @returns {object[]} Array of findings
 */
const checkCodeSecurity = (code) => {
    const findings = []
    const checks = [
        { pattern: /eval\s*\(/g, severity: 'HIGH', message: 'Use of eval() detected' },
        { pattern: /innerHTML\s*=/g, severity: 'MEDIUM', message: 'Direct innerHTML assignment' },
        { pattern: /document\.write/g, severity: 'MEDIUM', message: 'Use of document.write' },
        { pattern: /new\s+Function\s*\(/g, severity: 'HIGH', message: 'Dynamic function creation' },
        { pattern: /\bexec\s*\(/g, severity: 'HIGH', message: 'Possible command execution' },
        { pattern: /nodeIntegration:\s*true/g, severity: 'HIGH', message: 'Node integration enabled' },
        { pattern: /contextIsolation:\s*false/g, severity: 'HIGH', message: 'Context isolation disabled' },
        { pattern: /webSecurity:\s*false/g, severity: 'MEDIUM', message: 'Web security disabled' }
    ]

    for (const check of checks) {
        let match
        while ((match = check.pattern.exec(code)) !== null) {
            findings.push({
                severity: check.severity,
                message: check.message,
                position: match.index
            })
        }
    }

    return findings
}

/**
 * Security audit results object.
 * @param {string} filePath - File that was audited
 * @param {object[]} findings - Security findings
 * @returns {object} Audit result
 */
const createAuditResult = (filePath, findings) => ({
    file: filePath,
    timestamp: new Date().toISOString(),
    findings,
    summary: {
        high: findings.filter(f => f.severity === 'HIGH').length,
        medium: findings.filter(f => f.severity === 'MEDIUM').length,
        low: findings.filter(f => f.severity === 'LOW').length
    }
})

module.exports = {
    generateCSP,
    sanitizeInput,
    validateUrl,
    checkCodeSecurity,
    createAuditResult
}
