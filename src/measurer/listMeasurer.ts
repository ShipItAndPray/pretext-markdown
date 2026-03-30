import type { ListItem } from '../types'
import { pretextMeasure } from './pretextBridge'

const LIST_LINE_HEIGHT = 24
const LIST_ITEM_SPACING = 4
const LIST_INDENT = 24
const LIST_MARGIN_BOTTOM = 16

/**
 * Measure a list block, accounting for indentation and nested items.
 */
export function measureList(
  items: ListItem[],
  _ordered: boolean,
  maxWidth: number,
  font: string
): number {
  const totalItemHeight = measureItems(items, maxWidth, font, 0)
  return totalItemHeight + LIST_MARGIN_BOTTOM
}

function measureItems(
  items: ListItem[],
  maxWidth: number,
  font: string,
  depth: number
): number {
  let total = 0
  const indent = LIST_INDENT * (depth + 1)
  const availableWidth = maxWidth - indent

  for (const item of items) {
    // Measure the item's own text
    const { height } = pretextMeasure(item.text, font, availableWidth, LIST_LINE_HEIGHT)
    total += height + LIST_ITEM_SPACING

    // Measure nested sub-items
    if (item.subItems && item.subItems.length > 0) {
      total += measureItems(item.subItems, maxWidth, font, depth + 1)
    }
  }

  return total
}
