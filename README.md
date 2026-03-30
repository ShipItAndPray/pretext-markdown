# @shipitandpray/pretext-markdown

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://shipitandpray.github.io/pretext-markdown/) [![npm](https://img.shields.io/npm/v/@shipitandpray/pretext-markdown?color=blue)](https://www.npmjs.com/package/@shipitandpray/pretext-markdown)

Markdown renderer that knows the exact height of every block **before** rendering. Zero layout shift during AI streaming.

## The Problem

AI outputs markdown. Every chat UI renders it with `react-markdown` or `marked`, which creates DOM nodes, measures them, and causes reflow. During streaming, this happens on every token -- visible jank.

**pretext-markdown** uses [@chenglou/pretext](https://github.com/chenglou/pretext) to pre-calculate the height of every markdown block (paragraphs, headings, lists, code blocks) so the container size is known before render.

## Comparison

| Feature | react-markdown | pretext-markdown |
|---------|---------------|-----------------|
| Layout shift during streaming | Every token | **Zero** |
| Height prediction | None | Per-block pre-measurement |
| Streaming optimization | Full re-render | Incremental (only current block) |
| Bundle size | ~50KB | ~12KB |

## Install

```bash
npm install @shipitandpray/pretext-markdown marked
# peer dependencies
npm install react @chenglou/pretext
```

## Usage

### Static rendering

```tsx
import { PretextMarkdown } from '@shipitandpray/pretext-markdown'

function ChatMessage({ content }: { content: string }) {
  return (
    <PretextMarkdown
      content={content}
      maxWidth={600}
      codeTheme="dark"
    />
  )
}
```

### Streaming mode (AI chat)

```tsx
import { PretextMarkdown } from '@shipitandpray/pretext-markdown'
import { useState, useEffect } from 'react'

function StreamingChat() {
  const [content, setContent] = useState('')

  useEffect(() => {
    // Connect to your AI API
    const stream = fetchAIStream('/api/chat', { message: 'Hello' })
    stream.on('token', (token: string) => {
      setContent(prev => prev + token)
    })
    return () => stream.cancel()
  }, [])

  return (
    <PretextMarkdown
      content={content}
      maxWidth={600}
      streaming={true}
      onHeightChange={(h) => {
        // Scroll container to bottom
        window.scrollTo(0, document.body.scrollHeight)
      }}
    />
  )
}
```

### Using the parser and measurer directly

```ts
import { markdownToBlocks, measureBlocks, totalHeight } from '@shipitandpray/pretext-markdown'

const blocks = markdownToBlocks('# Hello\n\nWorld')
const measured = measureBlocks(blocks, { maxWidth: 600 })
console.log('Total height:', totalHeight(measured), 'px')
// => Total height: 104 px
```

### Incremental parser for custom streaming

```ts
import { IncrementalParser } from '@shipitandpray/pretext-markdown'

const parser = new IncrementalParser({ maxWidth: 600 })

// As tokens arrive from your AI API:
function onToken(token: string) {
  const { allBlocks, totalHeight, partialBlock } = parser.appendToken(token)
  // Only the current block was re-measured
  // All completed blocks use cached heights
  updateUI(allBlocks, totalHeight)
}
```

## API

### `<PretextMarkdown>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | required | Markdown content |
| `maxWidth` | `number` | required | Max width for text measurement (px) |
| `streaming` | `boolean` | `false` | Enable streaming mode |
| `fonts` | `Partial<BlockFonts>` | See defaults | Custom fonts per block type |
| `onHeightChange` | `(height: number) => void` | - | Height change callback |
| `codeTheme` | `'light' \| 'dark'` | `'light'` | Code block theme |
| `className` | `string` | - | CSS class |
| `style` | `CSSProperties` | - | Inline styles |

### `IncrementalParser`

```ts
class IncrementalParser {
  constructor(options: { maxWidth: number; fonts?: Partial<BlockFonts> })
  appendToken(token: string): IncrementalResult
  reset(): void
  getBuffer(): string
}
```

### Block types

```ts
type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 1-6; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'list'; ordered: boolean; items: ListItem[] }
  | { type: 'blockquote'; blocks: MarkdownBlock[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' }
  | { type: 'image'; src: string; alt: string }
```

## How it works

1. **Parse**: `marked.lexer()` tokenizes markdown into block-level tokens
2. **Measure**: Each block type gets measured with the correct font using `@chenglou/pretext` (`prepare()` + `layout()`)
3. **Render**: Blocks are rendered into pre-sized containers (no layout shift)
4. **Stream**: `IncrementalParser` caches completed block heights and only re-measures the current incomplete block

### Measurement strategy

- Paragraphs/headings: `prepare(text, font)` + `layout(prepared, maxWidth, lineHeight)` for accurate text wrapping
- Code blocks: `lineCount * 20px + 32px` (monospace, no wrapping)
- Lists: Each item measured with indent offset subtracted from available width
- Tables: Fixed row height (36px body, 40px header)

## Performance

| Metric | Target |
|--------|--------|
| Parse + measure 100 blocks | < 10ms |
| Token append + re-measure | < 0.5ms |
| Render 100 blocks | < 16ms (one frame) |
| Layout shift during streaming | 0px |

## License

MIT
