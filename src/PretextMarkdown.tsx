import React, { useMemo } from 'react'
import type { BlockFonts } from './types'
import { BLOCK_FONTS } from './types'
import { markdownToBlocks } from './parser/markdownToBlocks'
import { measureBlocks, totalHeight } from './measurer/blockMeasurer'
import { BlockRenderer } from './renderer/BlockRenderer'
import { StreamingMarkdown } from './streaming/StreamingMarkdown'

export interface PretextMarkdownProps {
  /** Markdown content to render */
  content: string
  /** Maximum width for text measurement (px) */
  maxWidth: number
  /** Custom fonts for block types */
  fonts?: Partial<BlockFonts>
  /** CSS class */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** Enable streaming mode (incremental parsing) */
  streaming?: boolean
  /** Called when total pre-measured height changes */
  onHeightChange?: (height: number) => void
  /** Enable syntax highlighting in code blocks */
  syntaxHighlight?: boolean
  /** Code block theme */
  codeTheme?: 'light' | 'dark'
}

/**
 * PretextMarkdown -- Pre-measured markdown renderer.
 *
 * In normal mode, parses and measures all blocks on each render.
 * In streaming mode, delegates to StreamingMarkdown for incremental parsing.
 */
export function PretextMarkdown({
  content,
  maxWidth,
  fonts,
  className,
  style,
  streaming = false,
  onHeightChange,
  codeTheme = 'light',
}: PretextMarkdownProps): React.ReactElement {
  if (streaming) {
    return (
      <StreamingMarkdown
        content={content}
        maxWidth={maxWidth}
        fonts={fonts}
        className={className}
        style={style}
        onHeightChange={onHeightChange}
        codeTheme={codeTheme}
      />
    )
  }

  return (
    <StaticMarkdown
      content={content}
      maxWidth={maxWidth}
      fonts={fonts}
      className={className}
      style={style}
      onHeightChange={onHeightChange}
      codeTheme={codeTheme}
    />
  )
}

function StaticMarkdown({
  content,
  maxWidth,
  fonts,
  className,
  style,
  onHeightChange,
  codeTheme = 'light',
}: Omit<PretextMarkdownProps, 'streaming' | 'syntaxHighlight'>): React.ReactElement {
  const mergedFonts = useMemo(() => ({ ...BLOCK_FONTS, ...fonts }), [fonts])

  const measured = useMemo(() => {
    const blocks = markdownToBlocks(content)
    return measureBlocks(blocks, { maxWidth, fonts: mergedFonts })
  }, [content, maxWidth, mergedFonts])

  const height = totalHeight(measured)

  // Notify parent of height
  React.useEffect(() => {
    onHeightChange?.(height)
  }, [height, onHeightChange])

  return (
    <div
      className={className}
      style={{
        ...style,
        minHeight: height,
        position: 'relative',
      }}
    >
      {measured.map((m, i) => (
        <BlockRenderer key={i} measured={m} codeTheme={codeTheme} />
      ))}
    </div>
  )
}
