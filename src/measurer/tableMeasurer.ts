const TABLE_ROW_HEIGHT = 36
const TABLE_HEADER_HEIGHT = 40
const TABLE_MARGIN_BOTTOM = 16

/**
 * Measure a table block. Each row has a fixed height.
 * Header row is slightly taller.
 */
export function measureTable(
  headers: string[],
  rows: string[][]
): number {
  // Suppress unused-var for headers (kept for API consistency and future column-width calc)
  void headers
  return TABLE_HEADER_HEIGHT + rows.length * TABLE_ROW_HEIGHT + TABLE_MARGIN_BOTTOM
}
