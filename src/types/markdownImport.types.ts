/** Response von POST /api/pages/import-markdown/:projectId */
export interface MarkdownImportResponse {
  sourcePageId: string
  markdownPathRelative: string
  targetsCreated: number
  linksInserted: number
}
