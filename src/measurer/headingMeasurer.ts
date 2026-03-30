import type { BlockFonts } from '../types'
import { pretextMeasure } from './pretextBridge'

const HEADING_LINE_HEIGHTS: Record<number, number> = {
  1: 40,
  2: 32,
  3: 28,
  4: 24,
  5: 22,
  6: 20,
}

const HEADING_MARGIN_BOTTOM = 24

/**
 * Measure a heading block at the appropriate font size.
 */
export function measureHeading(
  text: string,
  level: 1 | 2 | 3 | 4 | 5 | 6,
  maxWidth: number,
  fonts: BlockFonts
): number {
  const fontKey = `h${level}` as keyof BlockFonts
  const font = fonts[fontKey]
  const lineHeight = HEADING_LINE_HEIGHTS[level]

  const { height } = pretextMeasure(text, font, maxWidth, lineHeight)
  return height + HEADING_MARGIN_BOTTOM
}
