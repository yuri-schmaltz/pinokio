/**
 * Performance benchmarks for lib modules.
 * Run standalone: node test/perf/benchmark.js
 */

const { performance } = require('perf_hooks')

// Inline implementations to avoid Electron dependency
const normalizeInspectorUrl = (value) => {
    if (!value) return null
    try {
        return new URL(value).href
    } catch (_) {
        return value
    }
}

const flattenFrameTree = (frame, acc = [], depth = 0) => {
    if (!frame) return acc
    acc.push({ frame, depth, url: normalizeInspectorUrl(frame.url || ''), name: frame.name || null })
    const children = Array.isArray(frame.frames) ? frame.frames : []
    for (const child of children) {
        flattenFrameTree(child, acc, depth + 1)
    }
    return acc
}

// Generate mock frame tree
const generateFrameTree = (depth, breadth) => {
    if (depth === 0) return null
    const frame = {
        url: `http://example.com/level-${depth}`,
        name: `frame-${depth}-${Math.random().toString(36).slice(2, 8)}`,
        frames: []
    }
    for (let i = 0; i < breadth; i++) {
        const child = generateFrameTree(depth - 1, breadth)
        if (child) frame.frames.push(child)
    }
    return frame
}

const benchmark = (name, fn, iterations = 1000) => {
    // Warmup
    for (let i = 0; i < 100; i++) fn()

    const start = performance.now()
    for (let i = 0; i < iterations; i++) fn()
    const elapsed = performance.now() - start

    console.log(`${name}: ${(elapsed / iterations).toFixed(4)}ms avg (${iterations} iterations)`)
    return elapsed / iterations
}

console.log('=== Pinokio Performance Benchmarks ===\n')

// Benchmark 1: URL normalization
console.log('URL Normalization:')
benchmark('normalizeInspectorUrl (valid)', () => {
    normalizeInspectorUrl('http://example.com/path?query=1#hash')
})
benchmark('normalizeInspectorUrl (invalid)', () => {
    normalizeInspectorUrl('not-a-valid-url')
})
benchmark('normalizeInspectorUrl (empty)', () => {
    normalizeInspectorUrl(null)
})

console.log('')

// Benchmark 2: Frame tree flattening
console.log('Frame Tree Flattening:')
const smallTree = generateFrameTree(3, 2) // 7 frames
const mediumTree = generateFrameTree(4, 3) // 40 frames  
const largeTree = generateFrameTree(5, 3) // 121 frames

benchmark('flattenFrameTree (7 frames)', () => {
    flattenFrameTree(smallTree, [])
})
benchmark('flattenFrameTree (40 frames)', () => {
    flattenFrameTree(mediumTree, [])
})
benchmark('flattenFrameTree (121 frames)', () => {
    flattenFrameTree(largeTree, [])
})

console.log('')

// Benchmark 3: Memory usage
console.log('Memory Usage:')
const before = process.memoryUsage()
const trees = []
for (let i = 0; i < 100; i++) {
    trees.push(flattenFrameTree(generateFrameTree(4, 3), []))
}
const after = process.memoryUsage()
console.log(`Heap used for 100 medium trees: ${((after.heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2)}MB`)

console.log('\n=== Benchmarks Complete ===')
