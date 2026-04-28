import { describe, expect, it } from 'vitest'
import {
  buildLinkGraphMarkdown,
  sortLinksForExport,
  sortPagesForExport,
} from './linkGraphExport'
import type { PageLinkRow, PageRow } from '@/types/database.types'

const page = (id: string, name: string): PageRow => ({
  id,
  project_id: 'p1',
  category_id: null,
  name,
  type: 'spoke',
  status: 'draft',
  url_slug: 'a',
  markdown_file_path: null,
  word_count: 0,
  position_x: null,
  position_y: null,
  created_at: '',
  updated_at: '',
})

describe('sortPagesForExport', () => {
  it('sorts by name locale de', () => {
    const sorted = sortPagesForExport([
      page('2', 'Zebra'),
      page('1', 'Arzt'),
      page('3', 'Mittag'),
    ]).map((p) => p.name)
    expect(sorted).toEqual(['Arzt', 'Mittag', 'Zebra'])
  })
})

describe('sortLinksForExport', () => {
  const link = (partial: Partial<PageLinkRow> & Pick<PageLinkRow, 'id'>): PageLinkRow => ({
    project_id: 'p',
    from_page_id: 'a',
    to_page_id: 'b',
    anchor_text: null,
    context_sentence: null,
    placement: null,
    line_number_start: null,
    line_number_end: null,
    created_at: '',
    updated_at: '',
    ...partial,
  })

  it('orders by from then to then id', () => {
    const sorted = sortLinksForExport([
      link({ id: 'x', from_page_id: 'b', to_page_id: 'a' }),
      link({ id: 'y', from_page_id: 'a', to_page_id: 'z' }),
      link({ id: 'z', from_page_id: 'a', to_page_id: 'a' }),
    ]).map((l) => l.id)
    expect(sorted).toEqual(['z', 'y', 'x'])
  })
})

describe('buildLinkGraphMarkdown', () => {
  it('pipes in anchor_text do not split columns', () => {
    const p = page('p1', 'Von hier')
    const q = page('q1', 'Dort')
    const md = buildLinkGraphMarkdown({
      projectName: 'T',
      pages: [p, q],
      pageLinks: [
        {
          id: 'l1',
          project_id: 'p',
          from_page_id: 'p1',
          to_page_id: 'q1',
          anchor_text: 'a|b|c',
          context_sentence: null,
          placement: null,
          line_number_start: null,
          line_number_end: null,
          created_at: '',
          updated_at: '',
        },
      ],
    })
    expect(md).toContain('a·b·c')
    expect(md.split('|').length).toBeGreaterThan(9)
  })

  it('empty links yields Keine Links', () => {
    const md = buildLinkGraphMarkdown({ projectName: 'X', pages: [], pageLinks: [] })
    expect(md).toContain('Keine Links im Projekt')
  })
})
