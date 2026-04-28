/** Ensures UNIQUE(from_page_id, to_page_id, anchor_text, line_start, line_end) across batch */
export type OutgoingLinkLine = {
  toPageId: string
  anchorText: string
  lineStart: number
  lineEnd: number
}

export function dedupeOutgoingLinks(
  rows: Pick<OutgoingLinkLine, 'toPageId' | 'anchorText' | 'lineStart'>[]
): OutgoingLinkLine[] {
  const counts = new Map<string, number>()
  return rows.map((r) => {
    const key = `${r.toPageId}\0${r.anchorText}\0${r.lineStart}`
    const n = (counts.get(key) ?? 0) + 1
    counts.set(key, n)
    const lineEnd = n === 1 ? r.lineStart : r.lineStart + (n - 1)
    return {
      toPageId: r.toPageId,
      anchorText: r.anchorText,
      lineStart: r.lineStart,
      lineEnd,
    }
  })
}
