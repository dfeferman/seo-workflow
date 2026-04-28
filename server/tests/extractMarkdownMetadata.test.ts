import { describe, expect, it } from 'vitest'
import { extractMarkdownMetadata } from '../lib/extractMarkdownMetadata.js'

describe('extractMarkdownMetadata', () => {
  it('extracts h1 title and links with line numbers', () => {
    const md = `# Mein Titel

Hallo [a](https://example.com/pfad) und [b](/other).
`
    const x = extractMarkdownMetadata(md)
    expect(x.title).toBe('Mein Titel')
    expect(x.links.length).toBe(2)
    expect(x.links[0].url).toContain('example.com')
    expect(x.links[0].line).toBeGreaterThan(0)
    expect(x.wordCount).toBeGreaterThan(2)
  })

  it('returns null title if no h1', () => {
    const x = extractMarkdownMetadata(`## Zwei\n\n[ x ]( /a )`)
    expect(x.title).toBeNull()
    expect(x.links.length).toBe(1)
  })
})
