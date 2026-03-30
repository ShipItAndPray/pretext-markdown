const CODE_LINE_HEIGHT = 20
const CODE_PADDING = 32 // 16px top + 16px bottom
const CODE_MARGIN_BOTTOM = 16

/**
 * Measure a code block. Code blocks use monospace font with fixed line height,
 * so measurement is simply line count * line height + padding.
 * No text wrapping -- code blocks scroll horizontally.
 */
export function measureCode(code: string): number {
  const lines = code.split('\n')
  return lines.length * CODE_LINE_HEIGHT + CODE_PADDING + CODE_MARGIN_BOTTOM
}
