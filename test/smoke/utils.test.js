/**
 * Unit tests for lib/utils.js module.
 */

const assert = require('assert')

// Import directly since utils.js has no Electron dependencies
const { upsertKeyValue, titleBarOverlay } = require('../../lib/utils')

describe('utils module', () => {
    describe('upsertKeyValue', () => {
        it('updates existing key case-insensitively', () => {
            const obj = { 'Content-Type': 'text/plain' }
            upsertKeyValue(obj, 'content-type', 'application/json')
            assert.strictEqual(obj['Content-Type'], 'application/json')
        })

        it('inserts new key if not found', () => {
            const obj = { existing: 'value' }
            upsertKeyValue(obj, 'newKey', 'newValue')
            assert.strictEqual(obj.newKey, 'newValue')
        })

        it('handles empty object', () => {
            const obj = {}
            upsertKeyValue(obj, 'key', 'value')
            assert.strictEqual(obj.key, 'value')
        })
    })

    describe('titleBarOverlay', () => {
        it('returns false for macOS', () => {
            const result = titleBarOverlay({ color: '#fff' }, true)
            assert.strictEqual(result, false)
        })

        it('returns colors object for non-macOS', () => {
            const colors = { color: '#fff', symbolColor: '#000' }
            const result = titleBarOverlay(colors, false)
            assert.deepStrictEqual(result, colors)
        })
    })
})
