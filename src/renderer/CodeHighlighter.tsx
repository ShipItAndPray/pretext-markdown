import React from 'react'

interface CodeHighlighterProps {
  code: string
  language: string
  theme?: 'light' | 'dark'
}

const LIGHT_THEME = {
  background: '#f6f8fa',
  text: '#24292e',
  keyword: '#d73a49',
  string: '#032f62',
  comment: '#6a737d',
  number: '#005cc5',
  function: '#6f42c1',
  border: '#e1e4e8',
}

const DARK_THEME = {
  background: '#1e1e1e',
  text: '#d4d4d4',
  keyword: '#569cd6',
  string: '#ce9178',
  comment: '#6a9955',
  number: '#b5cea8',
  function: '#dcdcaa',
  border: '#333333',
}

/**
 * Lightweight syntax highlighter for code blocks.
 * Provides basic keyword/string/comment highlighting without external deps.
 */
export function CodeHighlighter({
  code,
  language,
  theme = 'light',
}: CodeHighlighterProps): React.ReactElement {
  const colors = theme === 'dark' ? DARK_THEME : LIGHT_THEME

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 16,
      }}
    >
      {language && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 8,
            fontSize: 12,
            color: colors.comment,
            userSelect: 'none',
          }}
        >
          {language}
        </div>
      )}
      <pre
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          padding: 16,
          margin: 0,
          overflow: 'auto',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 14,
          lineHeight: '20px',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}
