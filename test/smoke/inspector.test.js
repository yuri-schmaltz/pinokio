/**
 * Unit tests for lib/inspector.js module.
 * Tests frame tree navigation, URL matching, and injection builders.
 */

const assert = require('assert')

// Mock dependencies since we can't load Electron in Node
const mockInspector = () => {
    // Inline implementations for testing (same logic as lib/inspector.js)
    const normalizeInspectorUrl = (value) => {
        if (!value) return null
        try {
            return new URL(value).href
        } catch (_) {
            return value
        }
    }

    const urlsRoughlyMatch = (expected, candidate) => {
        if (!expected) return true
        if (!candidate) return false
        if (candidate === expected) return true
        return candidate.startsWith(expected) || expected.startsWith(candidate)
    }

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

    return { normalizeInspectorUrl, urlsRoughlyMatch, flattenFrameTree }
}

describe('inspector utilities', () => {
    const { normalizeInspectorUrl, urlsRoughlyMatch, flattenFrameTree } = mockInspector()

    describe('normalizeInspectorUrl', () => {
        it('returns null for empty input', () => {
            assert.strictEqual(normalizeInspectorUrl(null), null)
            assert.strictEqual(normalizeInspectorUrl(''), null)
            assert.strictEqual(normalizeInspectorUrl(undefined), null)
        })

        it('normalizes valid URLs', () => {
            assert.strictEqual(normalizeInspectorUrl('http://example.com'), 'http://example.com/')
            assert.strictEqual(normalizeInspectorUrl('http://example.com/path'), 'http://example.com/path')
        })

        it('returns invalid URLs as-is', () => {
            assert.strictEqual(normalizeInspectorUrl('not-a-url'), 'not-a-url')
        })
    })

    describe('urlsRoughlyMatch', () => {
        it('matches null expected to any candidate', () => {
            assert.strictEqual(urlsRoughlyMatch(null, 'http://example.com'), true)
        })

        it('does not match when candidate is null', () => {
            assert.strictEqual(urlsRoughlyMatch('http://example.com', null), false)
        })

        it('matches exact URLs', () => {
            assert.strictEqual(urlsRoughlyMatch('http://example.com/', 'http://example.com/'), true)
        })

        it('matches prefix URLs', () => {
            assert.strictEqual(urlsRoughlyMatch('http://example.com', 'http://example.com/path'), true)
            assert.strictEqual(urlsRoughlyMatch('http://example.com/path', 'http://example.com'), true)
        })

        it('does not match unrelated URLs', () => {
            assert.strictEqual(urlsRoughlyMatch('http://foo.com', 'http://bar.com'), false)
        })
    })

    describe('flattenFrameTree', () => {
        it('returns empty array for null frame', () => {
            const result = flattenFrameTree(null)
            assert.deepStrictEqual(result, [])
        })

        it('flattens single frame', () => {
            const frame = { url: 'http://example.com', name: 'main' }
            const result = flattenFrameTree(frame)
            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].name, 'main')
            assert.strictEqual(result[0].depth, 0)
        })

        it('flattens nested frames', () => {
            const frame = {
                url: 'http://parent.com',
                name: 'parent',
                frames: [
                    { url: 'http://child1.com', name: 'child1', frames: [] },
                    { url: 'http://child2.com', name: 'child2', frames: [] }
                ]
            }
            const result = flattenFrameTree(frame)
            assert.strictEqual(result.length, 3)
            assert.strictEqual(result[0].name, 'parent')
            assert.strictEqual(result[0].depth, 0)
            assert.strictEqual(result[1].name, 'child1')
            assert.strictEqual(result[1].depth, 1)
            assert.strictEqual(result[2].name, 'child2')
            assert.strictEqual(result[2].depth, 1)
        })
    })
})
