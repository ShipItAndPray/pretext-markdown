import { pretextMeasure } from './pretextBridge'

const PARAGRAPH_LINE_HEIGHT = 24
const PARAGRAPH_MARGIN_BOTTOM = 16

/**
 * Measure a paragraph block.
 * Uses pretext's prepare() + layout() for accurate text height calculation.
 */
export function measureParagraph(
  text: string,
  maxWidth: number,
  font: string
): number {
  const { height } = pretextMeasure(text, font, maxWidth, PARAGRAPH_LINE_HEIGHT)
  return height + PARAGRAPH_MARGIN_BOTTOM
}
