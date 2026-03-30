import { describe, it, expect, beforeEach } from 'vitest'
import { IncrementalParser } from '../src/streaming/incrementalParser'
import { resetPretextBridge } from '../src/measurer/pretextBridge'

describe('IncrementalParser', () => {
  const options = { maxWidth: 600 }

  beforeEach(() => {
    resetPretextBridge()
  })

  it('handles a single token', () => {
    const parser = new IncrementalParser(options)
    const result = parser.appendToken('Hello')
    expect(result.allBlocks).toHaveLength(1)
    expect(result.totalHeight).toBeGreaterThan(0)
  })

  it('accumulates tokens into a paragraph', () => {
    const parser = new IncrementalParser(options)
    parser.appendToken('Hello ')
    parser.appendToken('world')
    const result = parser.appendToken('!')

    expect(result.allBlocks).toHaveLength(1)
    expect(result.allBlocks[0].type).toBe('paragraph')
    if (result.allBlocks[0].type === 'paragraph') {
      expect(result.allBlocks[0].text).toBe('Hello world!')
    }
  })

  it('detects completed blocks on double newline', () => {
    const parser = new IncrementalParser(options)
    parser.appendToken('First paragraph.')
    const result = parser.appendToken('\n\nSecond paragraph.')

    expect(result.allBlocks.length).toBeGreaterThanOrEqual(2)
    expect(result.completedBlocks.length).toBeGreaterThanOrEqual(1)
  })

  it('caches completed blocks and only re-measures partial', () => {
    const parser = new IncrementalParser(options)

    // Build up a completed block
    parser.appendToken('First paragraph.\n\n')
    const result1 = parser.appendToken('Second ')

    // The first block should be completed and cached
    expect(result1.allBlocks.length).toBeGreaterThanOrEqual(1)

    // Adding more to the second paragraph should not re-parse the first
    const result2 = parser.appendToken('paragraph continues.')

    expect(result2.allBlocks.length).toBeGreaterThanOrEqual(2)
    expect(result2.totalHeight).toBeGreaterThan(0)
  })

  it('handles streaming a heading followed by paragraph', () => {
    const parser = new IncrementalParser(options)
    parser.appendToken('# ')
    parser.appendToken('Title')
    parser.appendToken('\n\n')
    const result = parser.appendToken('Content here.')

    expect(result.allBlocks.length).toBeGreaterThanOrEqual(2)
    const types = result.allBlocks.map(b => b.type)
    expect(types).toContain('heading')
  })

  it('handles streaming a code block', () => {
    const parser = new IncrementalParser(options)
    parser.appendToken('```js\n')
    parser.appendToken('const x = 1\n')
    parser.appendToken('```')
    const result = parser.appendToken('\n\n')

    const codeBlocks = result.allBlocks.filter(b => b.type === 'code')
    expect(codeBlocks.length).toBeGreaterThanOrEqual(1)
  })

  it('reset clears all state', () => {
    const parser = new IncrementalParser(options)
    parser.appendToken('Some content\n\nMore content')
    parser.reset()

    const result = parser.appendToken('Fresh start')
    expect(result.allBlocks).toHaveLength(1)
    expect(parser.getBuffer()).toBe('Fresh start')
  })

  it('totalHeight grows as content is added', () => {
    const parser = new IncrementalParser(options)

    const r1 = parser.appendToken('First.')
    const h1 = r1.totalHeight

    const r2 = parser.appendToken('\n\nSecond.')
    const h2 = r2.totalHeight

    expect(h2).toBeGreaterThan(h1)
  })

  it('handles rapid token-by-token streaming', () => {
    const parser = new IncrementalParser(options)
    const tokens = 'The quick brown fox jumps over the lazy dog.'.split(' ')

    let lastResult
    for (const token of tokens) {
      lastResult = parser.appendToken(token + ' ')
    }

    expect(lastResult!.allBlocks).toHaveLength(1)
    expect(lastResult!.totalHeight).toBeGreaterThan(0)
  })
})
