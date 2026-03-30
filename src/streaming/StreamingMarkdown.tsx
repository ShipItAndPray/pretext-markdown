import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import type { MeasuredBlock, BlockFonts } from '../types'
import { BLOCK_FONTS } from '../types'
import { IncrementalParser } from './incrementalParser'
import { BlockRenderer } from '../renderer/BlockRenderer'

interface StreamingMarkdownProps {
  /** The current accumulated content (grows as tokens arrive) */
  content: string
  /** Maximum width for text measurement */
  maxWidth: number
  /** Custom fonts for block types */
  fonts?: Partial<BlockFonts>
  /** CSS class for the container */
  className?: string
  /** Inline styles for the container */
  style?: React.CSSProperties
  /** Called when total height changes */
  onHeightChange?: (height: number) => void
  /** Code block theme */
  codeTheme?: 'light' | 'dark'
}

/**
 * Streaming-optimized markdown renderer.
 *
 * Uses IncrementalParser internally to avoid re-parsing and re-measuring
 * completed blocks. Only the current incomplete block is re-measured
 * when content changes.
 */
export function StreamingMarkdown({
  content,
  maxWidth,
  fonts,
  className,
  style,
  onHeightChange,
  codeTheme = 'light',
}: StreamingMarkdownProps): React.ReactElement {
  const mergedFonts = useMemo(() => ({ ...BLOCK_FONTS, ...fonts }), [fonts])
  const parserRef = useRef<IncrementalParser | null>(null)
  const prevContentRef = useRef('')
  const measuredRef = useRef<MeasuredBlock[]>([])
  const heightRef = useRef(0)

  // Create parser on first render or when maxWidth/fonts change
  if (!parserRef.current) {
    parserRef.current = new IncrementalParser({ maxWidth, fonts: mergedFonts })
  }

  // Detect new tokens by comparing with previous content
  const getNewTokens = useCallback(() => {
    const prev = prevContentRef.current
    if (content.startsWith(prev)) {
      return content.slice(prev.length)
    }
    // Content was replaced entirely, reset parser
    return null
  }, [content])

  // Update on content change
  const newTokens = getNewTokens()

  if (newTokens === null) {
    // Full reset
    parserRef.current.reset()
    // Re-feed entire content character by character? No, feed as one chunk.
    // The parser handles this fine since it re-parses partial on each append.
    const result = parserRef.current.appendToken(content)
    measuredRef.current = result.measured
    heightRef.current = result.totalHeight
  } else if (newTokens.length > 0) {
    // Append only the new tokens
    const result = parserRef.current.appendToken(newTokens)
    measuredRef.current = result.measured
    heightRef.current = result.totalHeight
  }

  prevContentRef.current = content

  // Notify height changes
  useEffect(() => {
    onHeightChange?.(heightRef.current)
  }, [heightRef.current, onHeightChange])

  const measured = measuredRef.current

  return (
    <div
      className={className}
      style={{
        ...style,
        minHeight: heightRef.current,
        position: 'relative',
      }}
    >
      {measured.map((m, i) => (
        <BlockRenderer key={i} measured={m} codeTheme={codeTheme} />
      ))}
    </div>
  )
}
