import type { PageLinkRow, PageRow } from '@/types/database.types'

export function sortPagesForExport(pages: PageRow[]): PageRow[] {
  return [...pages].sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export function sortLinksForExport(pageLinks: PageLinkRow[]): PageLinkRow[] {
  return [...pageLinks].sort((a, b) => {
    const cmpFrom = a.from_page_id.localeCompare(b.from_page_id)
    if (cmpFrom !== 0) return cmpFrom
    const cmpTo = a.to_page_id.localeCompare(b.to_page_id)
    if (cmpTo !== 0) return cmpTo
    return a.id.localeCompare(b.id)
  })
}

export type LinkGraphJsonExport = {
  exported_at: string
  project_id: string
  project_name: string
  pages: PageRow[]
  page_links: PageLinkRow[]
}

export function buildLinkGraphJsonPayload(args: {
  exportedAt: string
  projectId: string
  projectName: string
  pages: PageRow[]
  pageLinks: PageLinkRow[]
}): LinkGraphJsonExport {
  return {
    exported_at: args.exportedAt,
    project_id: args.projectId,
    project_name: args.projectName,
    pages: sortPagesForExport(args.pages),
    page_links: sortLinksForExport(args.pageLinks),
  }
}

/** Dateiname ohne Endung: `link-graph-{8 hex aus uuid}-{yyyy-mm-dd}` */
export function linkGraphExportFileBase(projectId: string): string {
  const short = projectId.replace(/-/g, '').slice(0, 8)
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `link-graph-${short}-${yyyy}-${mm}-${dd}`
}

function mdCell(s: string | null | undefined): string {
  if (s == null || s === '') return '--'
  return String(s).replace(/\|/g, '·').replace(/\r?\n/g, ' ')
}

function numCell(n: number | null | undefined): string {
  if (n == null) return '--'
  return String(n)
}

export function buildLinkGraphMarkdown(args: {
  projectName: string
  pages: PageRow[]
  pageLinks: PageLinkRow[]
}): string {
  const byId = new Map(args.pages.map((p) => [p.id, p]))
  const exportedAt = new Date().toISOString()
  const header = ['# Link-Export', '', `**Projekt:** ${args.projectName}`, `**Export:** ${exportedAt}`, ''].join('\n')

  if (args.pageLinks.length === 0) {
    return `${header}\nKeine Links im Projekt.\n`
  }

  const lines = [
    header,
    '',
    '| Von | Nach | URL Quelle | URL Ziel | Anker | Kontext | Platzierung | Zeile von | Zeile bis |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]

  for (const link of sortLinksForExport(args.pageLinks)) {
    const from = byId.get(link.from_page_id)
    const to = byId.get(link.to_page_id)
    const fromName = from?.name ?? '--'
    const toName = to?.name ?? '--'
    const urlFrom = from?.url_slug != null && from.url_slug !== '' ? mdCell(from.url_slug) : '--'
    const urlTo = to?.url_slug != null && to.url_slug !== '' ? mdCell(to.url_slug) : '--'
    lines.push(
      `| ${mdCell(fromName)} | ${mdCell(toName)} | ${urlFrom} | ${urlTo} | ${mdCell(link.anchor_text)} | ${mdCell(link.context_sentence)} | ${mdCell(link.placement)} | ${numCell(link.line_number_start)} | ${numCell(link.line_number_end)} |`
    )
  }

  return lines.join('\n') + '\n'
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  downloadBlob(filename, new Blob([content], { type: mime }))
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
