import React from 'react'

interface InlineRendererProps {
  text: string
}

interface InlineNode {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'bolditalic'
  content: string
  href?: string
  children?: InlineNode[]
}

/**
 * Parse inline markdown syntax into nodes.
 * Handles: **bold**, *italic*, ***bolditalic***, `code`, [links](url)
 */
function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    // Bold+Italic: ***text***
    const boldItalicMatch = remaining.match(/^\*\*\*(.+?)\*\*\*/)
    if (boldItalicMatch) {
      nodes.push({ type: 'bolditalic', content: boldItalicMatch[1] })
      remaining = remaining.slice(boldItalicMatch[0].length)
      continue
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      nodes.push({ type: 'bold', content: boldMatch[1] })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/)
    if (italicMatch) {
      nodes.push({ type: 'italic', content: italicMatch[1] })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      nodes.push({ type: 'code', content: codeMatch[1] })
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      nodes.push({ type: 'link', content: linkMatch[1], href: linkMatch[2] })
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Plain text: consume characters until next special char
    const nextSpecial = remaining.slice(1).search(/[*`\[]/)
    if (nextSpecial === -1) {
      nodes.push({ type: 'text', content: remaining })
      break
    } else {
      nodes.push({ type: 'text', content: remaining.slice(0, nextSpecial + 1) })
      remaining = remaining.slice(nextSpecial + 1)
    }
  }

  return nodes
}

/**
 * Render inline markdown to React elements.
 */
export function InlineRenderer({ text }: InlineRendererProps): React.ReactElement {
  const nodes = parseInline(text)

  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'bold':
            return <strong key={i}>{node.content}</strong>
          case 'italic':
            return <em key={i}>{node.content}</em>
          case 'bolditalic':
            return <strong key={i}><em>{node.content}</em></strong>
          case 'code':
            return (
              <code
                key={i}
                style={{
                  backgroundColor: '#f0f0f0',
                  padding: '2px 6px',
                  borderRadius: 3,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.9em',
                }}
              >
                {node.content}
              </code>
            )
          case 'link':
            return (
              <a key={i} href={node.href} target="_blank" rel="noopener noreferrer">
                {node.content}
              </a>
            )
          case 'text':
          default:
            return <span key={i}>{node.content}</span>
        }
      })}
    </>
  )
}
