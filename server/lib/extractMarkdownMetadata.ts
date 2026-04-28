import type { Heading, Link } from 'mdast'
import { toString } from 'mdast-util-to-string'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

export type ExtractedLink = {
  url: string
  anchor: string
  line: number
}

export type MarkdownExtraction = {
  title: string | null
  wordCount: number
  links: ExtractedLink[]
}

function countWords(markdown: string): number {
  const t = markdown.trim()
  if (!t) return 0
  return t.split(/\s+/u).length
}

export function extractMarkdownMetadata(markdown: string): MarkdownExtraction {
  const tree = unified().use(remarkParse).parse(markdown) as import('mdast').Root

  let title: string | null = null
  const links: ExtractedLink[] = []

  visit(tree, 'heading', (node: Heading) => {
    if (title != null) return
    if (node.depth !== 1) return
    const text = toString(node).trim()
    if (text) title = text
  })

  visit(tree, 'link', (node: Link) => {
    const line = node.position?.start.line ?? 1
    links.push({
      url: node.url,
      anchor: toString(node).trim() || node.url,
      line,
    })
  })

  return {
    title,
    wordCount: countWords(markdown),
    links,
  }
}
