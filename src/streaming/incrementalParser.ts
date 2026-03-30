import type { MarkdownBlock, MeasuredBlock } from '../types'
import { markdownToBlocks } from '../parser/markdownToBlocks'
import { measureBlock, type MeasureOptions } from '../measurer/blockMeasurer'

export interface IncrementalResult {
  /** All blocks (completed + partial) */
  allBlocks: MarkdownBlock[]
  /** Blocks that were newly completed this token */
  completedBlocks: MarkdownBlock[]
  /** Current incomplete block (the last one being streamed) */
  partialBlock: MarkdownBlock | null
  /** Total height of all blocks */
  totalHeight: number
  /** All measured blocks with offsets */
  measured: MeasuredBlock[]
}

/**
 * Incremental markdown parser for streaming.
 *
 * Key optimization: completed blocks (separated by double newlines or block-level
 * boundaries) are cached. Only the current incomplete block is re-parsed and
 * re-measured on each token append.
 */
export class IncrementalParser {
  private buffer = ''
  private cachedCompletedBlocks: MarkdownBlock[] = []
  private cachedCompletedHeights: number[] = []
  private cachedCompletedOffsets: number[] = []
  private lastCompletedEndIndex = 0
  private options: MeasureOptions

  constructor(options: MeasureOptions) {
    this.options = options
  }

  /**
   * Append a token and return the updated state.
   * Only re-parses and re-measures the current incomplete block.
   */
  appendToken(token: string): IncrementalResult {
    this.buffer += token

    // Find the boundary between completed and partial content.
    // A block is "completed" when followed by a double newline (\n\n),
    // or when a new block-level element starts (heading, code fence, hr, list marker).
    const completedEnd = this.findCompletedBoundary(this.buffer)

    let newlyCompleted: MarkdownBlock[] = []

    // If the completed portion grew, parse the new completed blocks
    if (completedEnd > this.lastCompletedEndIndex) {
      const completedText = this.buffer.slice(0, completedEnd)
      const allCompleted = markdownToBlocks(completedText)

      // The new ones are those beyond what we already cached
      newlyCompleted = allCompleted.slice(this.cachedCompletedBlocks.length)

      // Update cached completed blocks
      this.cachedCompletedBlocks = allCompleted

      // Measure newly completed blocks and cache their heights
      let offset = 0
      if (this.cachedCompletedHeights.length > 0) {
        const lastIdx = this.cachedCompletedHeights.length - 1
        offset = this.cachedCompletedOffsets[lastIdx] + this.cachedCompletedHeights[lastIdx]
      }

      for (const block of newlyCompleted) {
        const h = measureBlock(block, this.options)
        this.cachedCompletedHeights.push(h)
        this.cachedCompletedOffsets.push(offset)
        offset += h
      }

      this.lastCompletedEndIndex = completedEnd
    }

    // Parse the remaining partial text
    const partialText = this.buffer.slice(completedEnd).trim()
    let partialBlock: MarkdownBlock | null = null
    let partialHeight = 0

    if (partialText.length > 0) {
      const partialBlocks = markdownToBlocks(partialText)
      // Typically yields one block, but could be more if the partial text
      // contains multiple block-level elements
      if (partialBlocks.length > 0) {
        partialBlock = partialBlocks[partialBlocks.length - 1]
        // Measure only the partial block (the key optimization)
        partialHeight = partialBlocks.reduce(
          (sum, b) => sum + measureBlock(b, this.options),
          0
        )
      }
    }

    // Compute total height
    const completedTotalHeight = this.cachedCompletedHeights.reduce((a, b) => a + b, 0)
    const totalHeight = completedTotalHeight + partialHeight

    // Build measured array from cache + partial
    const measured: MeasuredBlock[] = this.cachedCompletedBlocks.map((block, i) => ({
      block,
      height: this.cachedCompletedHeights[i],
      offsetY: this.cachedCompletedOffsets[i],
    }))

    if (partialText.length > 0) {
      const partialBlocks = markdownToBlocks(partialText)
      let offset = completedTotalHeight
      for (const block of partialBlocks) {
        const h = measureBlock(block, this.options)
        measured.push({ block, height: h, offsetY: offset })
        offset += h
      }
    }

    const allBlocks = measured.map(m => m.block)

    return {
      allBlocks,
      completedBlocks: newlyCompleted,
      partialBlock,
      totalHeight,
      measured,
    }
  }

  /**
   * Find the index in the buffer where all completed blocks end.
   * A block is completed when followed by \n\n (blank line separator).
   */
  private findCompletedBoundary(text: string): number {
    // Find the last double-newline, which marks the end of completed content
    const lastDoubleNewline = text.lastIndexOf('\n\n')
    if (lastDoubleNewline === -1) return 0

    // Return the position after the double newline
    return lastDoubleNewline + 2
  }

  /**
   * Reset the parser state.
   */
  reset(): void {
    this.buffer = ''
    this.cachedCompletedBlocks = []
    this.cachedCompletedHeights = []
    this.cachedCompletedOffsets = []
    this.lastCompletedEndIndex = 0
  }

  /**
   * Get the current buffer content.
   */
  getBuffer(): string {
    return this.buffer
  }
}
