import { describe, it, expect, beforeEach } from 'vitest'
import { measureBlock, measureBlocks, totalHeight } from '../src/measurer/blockMeasurer'
import { resetPretextBridge } from '../src/measurer/pretextBridge'
import type { MarkdownBlock } from '../src/types'

describe('blockMeasurer', () => {
  const options = { maxWidth: 600 }

  beforeEach(() => {
    // Ensure fallback measurement is used in tests
    resetPretextBridge()
  })

  describe('measureBlock', () => {
    it('measures a paragraph', () => {
      const block: MarkdownBlock = { type: 'paragraph', text: 'Hello world' }
      const height = measureBlock(block, options)
      expect(height).toBeGreaterThan(0)
      // Short text should be one line (24px line height) + 16px margin = 40px
      expect(height).toBe(40)
    })

    it('measures a long paragraph with wrapping', () => {
      const longText = 'This is a much longer paragraph that should wrap across multiple lines when rendered at a reasonable width. It contains enough text to ensure that the measurement accounts for line wrapping correctly.'
      const block: MarkdownBlock = { type: 'paragraph', text: longText }
      const height = measureBlock(block, options)
      // Should be taller than a single line
      expect(height).toBeGreaterThan(40)
    })

    it('measures headings at different levels', () => {
      const h1: MarkdownBlock = { type: 'heading', level: 1, text: 'Big heading' }
      const h3: MarkdownBlock = { type: 'heading', level: 3, text: 'Small heading' }
      const h1Height = measureBlock(h1, options)
      const h3Height = measureBlock(h3, options)
      // H1 has larger line height (40px vs 28px) so should be taller
      expect(h1Height).toBeGreaterThan(h3Height)
    })

    it('measures a code block by line count', () => {
      const block: MarkdownBlock = {
        type: 'code',
        language: 'js',
        code: 'const a = 1\nconst b = 2\nconst c = 3',
      }
      const height = measureBlock(block, options)
      // 3 lines * 20px + 32px padding + 16px margin = 108
      expect(height).toBe(108)
    })

    it('measures a single-line code block', () => {
      const block: MarkdownBlock = {
        type: 'code',
        language: '',
        code: 'hello',
      }
      const height = measureBlock(block, options)
      // 1 line * 20px + 32px padding + 16px margin = 68
      expect(height).toBe(68)
    })

    it('measures a list', () => {
      const block: MarkdownBlock = {
        type: 'list',
        ordered: false,
        items: [
          { text: 'Item 1' },
          { text: 'Item 2' },
          { text: 'Item 3' },
        ],
      }
      const height = measureBlock(block, options)
      expect(height).toBeGreaterThan(0)
      // 3 items * (24px + 4px spacing) + 16px margin = 100
      expect(height).toBe(100)
    })

    it('measures a horizontal rule', () => {
      const block: MarkdownBlock = { type: 'hr' }
      const height = measureBlock(block, options)
      expect(height).toBe(32)
    })

    it('measures a table', () => {
      const block: MarkdownBlock = {
        type: 'table',
        headers: ['A', 'B'],
        rows: [['1', '2'], ['3', '4']],
      }
      const height = measureBlock(block, options)
      // 40px header + 2 * 36px rows + 16px margin = 128
      expect(height).toBe(128)
    })

    it('measures an image', () => {
      const block: MarkdownBlock = { type: 'image', src: 'test.png', alt: 'test' }
      const height = measureBlock(block, options)
      expect(height).toBe(216) // 200 + 16
    })

    it('measures a blockquote', () => {
      const block: MarkdownBlock = {
        type: 'blockquote',
        blocks: [{ type: 'paragraph', text: 'Quoted text' }],
      }
      const height = measureBlock(block, options)
      expect(height).toBeGreaterThan(0)
    })
  })

  describe('measureBlocks', () => {
    it('measures multiple blocks with correct offsets', () => {
      const blocks: MarkdownBlock[] = [
        { type: 'heading', level: 1, text: 'Title' },
        { type: 'paragraph', text: 'Content' },
        { type: 'hr' },
      ]
      const measured = measureBlocks(blocks, options)

      expect(measured).toHaveLength(3)
      expect(measured[0].offsetY).toBe(0)
      expect(measured[1].offsetY).toBe(measured[0].height)
      expect(measured[2].offsetY).toBe(measured[0].height + measured[1].height)
    })

    it('returns empty array for no blocks', () => {
      const measured = measureBlocks([], options)
      expect(measured).toHaveLength(0)
    })
  })

  describe('totalHeight', () => {
    it('returns 0 for empty array', () => {
      expect(totalHeight([])).toBe(0)
    })

    it('returns sum of all block heights', () => {
      const blocks: MarkdownBlock[] = [
        { type: 'hr' },
        { type: 'hr' },
      ]
      const measured = measureBlocks(blocks, options)
      expect(totalHeight(measured)).toBe(64) // 32 + 32
    })
  })
})
