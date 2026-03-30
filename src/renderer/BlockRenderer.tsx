import React from 'react'
import type { MarkdownBlock, MeasuredBlock } from '../types'
import { InlineRenderer } from './InlineRenderer'
import { CodeHighlighter } from './CodeHighlighter'

interface BlockRendererProps {
  measured: MeasuredBlock
  codeTheme?: 'light' | 'dark'
}

/**
 * Render a single measured block to React elements.
 * The container is pre-sized to the measured height to prevent layout shift.
 */
export function BlockRenderer({
  measured,
  codeTheme = 'light',
}: BlockRendererProps): React.ReactElement {
  const { block, height } = measured

  return (
    <div
      style={{
        minHeight: height,
        position: 'relative',
      }}
      data-block-type={block.type}
    >
      {renderBlock(block, codeTheme)}
    </div>
  )
}

function renderBlock(
  block: MarkdownBlock,
  codeTheme: 'light' | 'dark'
): React.ReactElement {
  switch (block.type) {
    case 'paragraph':
      return (
        <p style={{ margin: '0 0 16px 0', lineHeight: '24px', fontSize: 16 }}>
          <InlineRenderer text={block.text} />
        </p>
      )

    case 'heading': {
      const Tag = `h${block.level}` as keyof React.JSX.IntrinsicElements
      const fontSizes: Record<number, number> = {
        1: 32, 2: 24, 3: 20, 4: 18, 5: 16, 6: 14,
      }
      const lineHeights: Record<number, number> = {
        1: 40, 2: 32, 3: 28, 4: 24, 5: 22, 6: 20,
      }
      return React.createElement(
        Tag,
        {
          style: {
            margin: '0 0 24px 0',
            fontSize: fontSizes[block.level],
            lineHeight: `${lineHeights[block.level]}px`,
            fontWeight: 600,
          },
        },
        React.createElement(InlineRenderer, { text: block.text })
      )
    }

    case 'code':
      return (
        <CodeHighlighter
          code={block.code}
          language={block.language}
          theme={codeTheme}
        />
      )

    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag
          style={{
            margin: '0 0 16px 0',
            paddingLeft: 24,
            lineHeight: '24px',
          }}
        >
          {block.items.map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <InlineRenderer text={item.text} />
              {item.subItems && item.subItems.length > 0 && (
                <ul style={{ paddingLeft: 24, marginTop: 4 }}>
                  {item.subItems.map((sub, j) => (
                    <li key={j} style={{ marginBottom: 4 }}>
                      <InlineRenderer text={sub.text} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ListTag>
      )
    }

    case 'blockquote':
      return (
        <blockquote
          style={{
            margin: '0 0 16px 0',
            padding: '8px 16px',
            borderLeft: '4px solid #ddd',
            color: '#555',
            fontStyle: 'italic',
          }}
        >
          {block.blocks.map((inner, i) => (
            <div key={i}>{renderBlock(inner, codeTheme)}</div>
          ))}
        </blockquote>
      )

    case 'table':
      return (
        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      borderBottom: '2px solid #ddd',
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      lineHeight: '24px',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        borderBottom: '1px solid #eee',
                        padding: '8px 12px',
                        lineHeight: '20px',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'hr':
      return (
        <hr
          style={{
            border: 'none',
            borderTop: '1px solid #ddd',
            margin: '16px 0 15px 0',
          }}
        />
      )

    case 'image':
      return (
        <div style={{ marginBottom: 16 }}>
          <img
            src={block.src}
            alt={block.alt}
            style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}
          />
        </div>
      )

    default:
      return <div />
  }
}
