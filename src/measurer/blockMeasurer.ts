import type { MarkdownBlock, MeasuredBlock, BlockFonts } from '../types'
import { BLOCK_FONTS } from '../types'
import { measureParagraph } from './paragraphMeasurer'
import { measureHeading } from './headingMeasurer'
import { measureList } from './listMeasurer'
import { measureCode } from './codeMeasurer'
import { measureTable } from './tableMeasurer'

export interface MeasureOptions {
  maxWidth: number
  fonts?: Partial<BlockFonts>
}

/**
 * Measure a single block and return its height in pixels.
 */
export function measureBlock(
  block: MarkdownBlock,
  options: MeasureOptions
): number {
  const fonts = { ...BLOCK_FONTS, ...options.fonts }
  const { maxWidth } = options

  switch (block.type) {
    case 'paragraph':
      return measureParagraph(block.text, maxWidth, fonts.paragraph)

    case 'heading':
      return measureHeading(block.text, block.level, maxWidth, fonts)

    case 'code':
      return measureCode(block.code)

    case 'list':
      return measureList(block.items, block.ordered, maxWidth, fonts.list)

    case 'blockquote': {
      // Blockquote has left border + padding, reducing available width
      const innerWidth = maxWidth - 32 // 16px padding-left + 4px border + 12px margin
      const innerHeight = block.blocks.reduce(
        (sum, inner) => sum + measureBlock(inner, { ...options, maxWidth: innerWidth }),
        0
      )
      return innerHeight + 16 // top + bottom padding
    }

    case 'table':
      return measureTable(block.headers, block.rows)

    case 'hr':
      return 32 // 1px line + 16px margin top + 15px margin bottom

    case 'image':
      return 200 + 16 // default image placeholder height + margin

    default:
      return 0
  }
}

/**
 * Measure all blocks and compute their vertical offsets.
 */
export function measureBlocks(
  blocks: MarkdownBlock[],
  options: MeasureOptions
): MeasuredBlock[] {
  const measured: MeasuredBlock[] = []
  let offsetY = 0

  for (const block of blocks) {
    const height = measureBlock(block, options)
    measured.push({ block, height, offsetY })
    offsetY += height
  }

  return measured
}

/**
 * Get the total height of all measured blocks.
 */
export function totalHeight(measured: MeasuredBlock[]): number {
  if (measured.length === 0) return 0
  const last = measured[measured.length - 1]
  return last.offsetY + last.height
}
