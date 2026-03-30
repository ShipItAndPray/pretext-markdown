export interface ListItem {
  text: string
  subItems?: ListItem[]
}

export type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'list'; ordered: boolean; items: ListItem[] }
  | { type: 'blockquote'; blocks: MarkdownBlock[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' }
  | { type: 'image'; src: string; alt: string }

export interface MeasuredBlock {
  block: MarkdownBlock
  height: number
  offsetY: number
}

export const BLOCK_FONTS = {
  paragraph: '16px Inter',
  h1: '32px Inter',
  h2: '24px Inter',
  h3: '20px Inter',
  h4: '18px Inter',
  h5: '16px Inter',
  h6: '14px Inter',
  code: '14px "JetBrains Mono"',
  list: '16px Inter',
  blockquote: '16px Inter italic',
} as const

export type BlockFonts = typeof BLOCK_FONTS
