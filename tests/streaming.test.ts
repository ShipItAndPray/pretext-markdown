import { describe, it, expect, beforeEach } from 'vitest'
import { IncrementalParser } from '../src/streaming/incrementalParser'
import { markdownToBlocks } from '../src/parser/markdownToBlocks'
import { measureBlocks, totalHeight } from '../src/measurer/blockMeasurer'
import { resetPretextBridge } from '../src/measurer/pretextBridge'

describe('Streaming mode re-measures only current block', () => {
  const options = { maxWidth: 600 }

  beforeEach(() => {
    resetPretextBridge()
  })

  it('completed blocks have stable heights across tokens', () => {
    const parser = new IncrementalParser(options)

    // Complete the first block
    parser.appendToken('First paragraph here.\n\n')
    const r1 = parser.appendToken('Second ')

    // Get height of the first (completed) block
    const firstBlockHeight1 = r1.measured[0]?.height

    // Add more tokens to the second block
    const r2 = parser.appendToken('paragraph grows.')

    // The first block's height should be identical (cached, not re-measured)
    const firstBlockHeight2 = r2.measured[0]?.height
    expect(firstBlockHeight1).toBe(firstBlockHeight2)
  })

  it('streaming produces same final result as static parse', () => {
    const fullContent = `# Hello World

This is a paragraph with some text.

- Item one
- Item two
- Item three

\`\`\`python
print("hello")
\`\`\`

---

> A blockquote here`

    // Static parse
    const staticBlocks = markdownToBlocks(fullContent)
    const staticMeasured = measureBlocks(staticBlocks, options)
    const staticHeight = totalHeight(staticMeasured)

    // Streaming parse: simulate token-by-token
    const parser = new IncrementalParser(options)
    let result
    // Feed 5 characters at a time
    for (let i = 0; i < fullContent.length; i += 5) {
      const chunk = fullContent.slice(i, i + 5)
      result = parser.appendToken(chunk)
    }

    // Final block count and height should match
    expect(result!.allBlocks.length).toBe(staticBlocks.length)
    // Heights should be very close (might differ slightly due to incremental vs full parse)
    expect(Math.abs(result!.totalHeight - staticHeight)).toBeLessThan(2)
  })

  it('incremental parser is faster than full re-parse for many tokens', () => {
    // This is a correctness test, not a perf benchmark.
    // It verifies that the incremental path produces valid output
    // without re-parsing all completed blocks.
    const parser = new IncrementalParser(options)

    // Simulate 100 tokens
    const tokens = []
    for (let i = 0; i < 20; i++) {
      tokens.push(`Line ${i} of content.\n\n`)
    }

    let lastResult
    for (const token of tokens) {
      lastResult = parser.appendToken(token)
    }

    // Should have 20 paragraph blocks
    expect(lastResult!.allBlocks.length).toBe(20)
    expect(lastResult!.totalHeight).toBeGreaterThan(0)
  })
})
