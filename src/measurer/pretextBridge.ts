/**
 * Bridge to @chenglou/pretext for text measurement.
 *
 * Pretext provides prepare() and layout() functions:
 *   - prepare(text, font) -> PreparedText
 *   - layout(preparedText, maxWidth, lineHeight) -> { height, lines }
 *
 * This bridge wraps those calls and provides a fallback for environments
 * where pretext is not available (e.g., tests, SSR).
 */

let pretextModule: {
  prepare: (text: string, font: string) => unknown
  layout: (prepared: unknown, maxWidth: number, lineHeight: number) => { height: number }
} | null = null

let loadAttempted = false

function loadPretext() {
  if (loadAttempted) return
  loadAttempted = true
  try {
    // Dynamic require so it doesn't fail at import time if not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pretextModule = require('@chenglou/pretext')
  } catch {
    // Pretext not available; use fallback measurement
    pretextModule = null
  }
}

/**
 * Estimate the average character width for a given font string.
 * Used as fallback when pretext is not available.
 */
function estimateCharWidth(font: string): number {
  // Extract font size from strings like "16px Inter" or "14px \"JetBrains Mono\""
  const sizeMatch = font.match(/(\d+)px/)
  const fontSize = sizeMatch ? parseInt(sizeMatch[1], 10) : 16

  // Monospace fonts have wider characters relative to font size
  const isMonospace = font.includes('JetBrains') || font.includes('monospace') || font.includes('Courier')

  // Average character width is roughly 0.55 * fontSize for proportional, 0.6 for monospace
  return fontSize * (isMonospace ? 0.6 : 0.55)
}

/**
 * Measure text using pretext if available, otherwise use a heuristic fallback.
 * Returns { height } for the given text at the specified font, maxWidth, and lineHeight.
 */
export function pretextMeasure(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): { height: number } {
  loadPretext()

  if (pretextModule) {
    const prepared = pretextModule.prepare(text, font)
    return pretextModule.layout(prepared, maxWidth, lineHeight)
  }

  // Fallback: estimate based on character count and average character width
  return fallbackMeasure(text, font, maxWidth, lineHeight)
}

export function fallbackMeasure(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): { height: number } {
  if (!text || text.trim().length === 0) {
    return { height: lineHeight }
  }

  const charWidth = estimateCharWidth(font)
  const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth))

  // Split by explicit newlines first, then estimate wrapping
  const paragraphs = text.split('\n')
  let totalLines = 0

  for (const para of paragraphs) {
    if (para.trim().length === 0) {
      totalLines += 1
    } else {
      totalLines += Math.max(1, Math.ceil(para.length / charsPerLine))
    }
  }

  return { height: totalLines * lineHeight }
}

/**
 * Reset the module loader state (for testing).
 */
export function resetPretextBridge() {
  pretextModule = null
  loadAttempted = false
}

/**
 * Inject a mock pretext module (for testing).
 */
export function injectPretext(mock: typeof pretextModule) {
  loadAttempted = true
  pretextModule = mock
}
