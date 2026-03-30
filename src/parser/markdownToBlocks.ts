import { marked, type Token, type Tokens } from 'marked'
import type { MarkdownBlock, ListItem } from '../types'

/**
 * Parse a markdown string into an array of typed blocks suitable for measurement.
 * Uses the marked lexer for robust tokenization, then maps tokens to our block types.
 */
export function markdownToBlocks(markdown: string): MarkdownBlock[] {
  const tokens = marked.lexer(markdown)
  return tokensToBlocks(tokens as Token[])
}

function tokensToBlocks(tokens: Token[]): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []

  for (const token of tokens) {
    const block = tokenToBlock(token)
    if (block) {
      blocks.push(block)
    }
  }

  return blocks
}

function tokenToBlock(token: Token): MarkdownBlock | null {
  switch (token.type) {
    case 'paragraph':
      return { type: 'paragraph', text: stripInlineHtml((token as Tokens.Paragraph).text) }

    case 'heading': {
      const h = token as Tokens.Heading
      return {
        type: 'heading',
        level: h.depth as 1 | 2 | 3 | 4 | 5 | 6,
        text: stripInlineHtml(h.text),
      }
    }

    case 'code': {
      const c = token as Tokens.Code
      return {
        type: 'code',
        language: c.lang || '',
        code: c.text,
      }
    }

    case 'list': {
      const l = token as Tokens.List
      return {
        type: 'list',
        ordered: l.ordered,
        items: l.items.map(mapListItem),
      }
    }

    case 'blockquote': {
      const bq = token as Tokens.Blockquote
      return {
        type: 'blockquote',
        blocks: tokensToBlocks((bq.tokens ?? []) as Token[]),
      }
    }

    case 'table': {
      const t = token as Tokens.Table
      return {
        type: 'table',
        headers: t.header.map((cell: { text: string }) => cell.text),
        rows: t.rows.map((row: { text: string }[]) =>
          row.map((cell: { text: string }) => cell.text)
        ),
      }
    }

    case 'hr':
      return { type: 'hr' }

    case 'html': {
      const html = token as Tokens.HTML
      const imgMatch = html.text.match(/<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/i)
      if (imgMatch) {
        return { type: 'image', src: imgMatch[1], alt: imgMatch[2] }
      }
      return { type: 'paragraph', text: html.text }
    }

    case 'space':
      return null

    default:
      if ('text' in token && typeof (token as { text: string }).text === 'string') {
        const text = (token as { text: string }).text
        if (text.trim()) {
          return { type: 'paragraph', text }
        }
      }
      return null
  }
}

function mapListItem(item: Tokens.ListItem): ListItem {
  const result: ListItem = { text: item.text }
  if (item.tokens) {
    for (const t of item.tokens) {
      if (t.type === 'list') {
        const listToken = t as Tokens.List
        result.subItems = listToken.items.map(mapListItem)
      }
    }
  }
  return result
}

/**
 * Strip inline HTML tags but keep the text content.
 */
function stripInlineHtml(text: string): string {
  return text.replace(/<\/?[^>]+(>|$)/g, '')
}
