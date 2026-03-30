import { describe, it, expect } from 'vitest'
import { markdownToBlocks } from '../src/parser/markdownToBlocks'

describe('markdownToBlocks', () => {
  it('parses a paragraph', () => {
    const blocks = markdownToBlocks('Hello world')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('paragraph')
    if (blocks[0].type === 'paragraph') {
      expect(blocks[0].text).toBe('Hello world')
    }
  })

  it('parses headings at all levels', () => {
    const md = '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6'
    const blocks = markdownToBlocks(md)
    expect(blocks).toHaveLength(6)
    blocks.forEach((b, i) => {
      expect(b.type).toBe('heading')
      if (b.type === 'heading') {
        expect(b.level).toBe(i + 1)
      }
    })
  })

  it('parses a code block with language', () => {
    const md = '```typescript\nconst x = 1\nconsole.log(x)\n```'
    const blocks = markdownToBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('code')
    if (blocks[0].type === 'code') {
      expect(blocks[0].language).toBe('typescript')
      expect(blocks[0].code).toContain('const x = 1')
    }
  })

  it('parses an unordered list', () => {
    const md = '- Item 1\n- Item 2\n- Item 3'
    const blocks = markdownToBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('list')
    if (blocks[0].type === 'list') {
      expect(blocks[0].ordered).toBe(false)
      expect(blocks[0].items).toHaveLength(3)
    }
  })

  it('parses an ordered list', () => {
    const md = '1. First\n2. Second\n3. Third'
    const blocks = markdownToBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('list')
    if (blocks[0].type === 'list') {
      expect(blocks[0].ordered).toBe(true)
      expect(blocks[0].items).toHaveLength(3)
    }
  })

  it('parses a blockquote', () => {
    const md = '> This is a quote'
    const blocks = markdownToBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('blockquote')
    if (blocks[0].type === 'blockquote') {
      expect(blocks[0].blocks).toHaveLength(1)
    }
  })

  it('parses a horizontal rule', () => {
    const md = '---'
    const blocks = markdownToBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('hr')
  })

  it('parses a table', () => {
    const md = '| Col 1 | Col 2 |\n| --- | --- |\n| A | B |\n| C | D |'
    const blocks = markdownToBlocks(md)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('table')
    if (blocks[0].type === 'table') {
      expect(blocks[0].headers).toEqual(['Col 1', 'Col 2'])
      expect(blocks[0].rows).toHaveLength(2)
    }
  })

  it('parses a complex document with multiple block types', () => {
    const md = `# Title

This is a paragraph.

- Item 1
- Item 2

\`\`\`js
const x = 1
\`\`\`

---

> A quote`
    const blocks = markdownToBlocks(md)
    expect(blocks.length).toBeGreaterThanOrEqual(5)

    const types = blocks.map(b => b.type)
    expect(types).toContain('heading')
    expect(types).toContain('paragraph')
    expect(types).toContain('list')
    expect(types).toContain('code')
    expect(types).toContain('hr')
    expect(types).toContain('blockquote')
  })

  it('handles empty input', () => {
    const blocks = markdownToBlocks('')
    expect(blocks).toHaveLength(0)
  })

  it('handles multiple paragraphs', () => {
    const md = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
    const blocks = markdownToBlocks(md)
    expect(blocks).toHaveLength(3)
    blocks.forEach(b => expect(b.type).toBe('paragraph'))
  })
})
