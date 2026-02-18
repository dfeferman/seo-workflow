import type { ArtifactRow } from '@/types/database.types'

export type ExportArtifactItem = {
  artifact: ArtifactRow
  resolvedPrompt: string
  resultText: string | null
}

/**
 * Erzeugt Markdown für eine Kategorie: alle Artefakte mit Prompt und Ergebnis.
 */
export function buildCategoryMarkdown(
  categoryName: string,
  items: ExportArtifactItem[]
): string {
  const lines: string[] = [
    `# ${categoryName}`,
    '',
    `Export: ${new Date().toLocaleString('de-DE')}`,
    '',
    '---',
    '',
  ]

  for (const { artifact, resolvedPrompt, resultText } of items) {
    lines.push(`## ${artifact.artifact_code} · ${artifact.name}`)
    if (artifact.description) {
      lines.push('', artifact.description, '')
    }
    lines.push('', '### Prompt', '', '```', resolvedPrompt, '```', '')
    lines.push('### Ergebnis', '')
    lines.push(resultText ?? '(kein Ergebnis)', '')
    lines.push('', '---', '')
  }

  return lines.join('\n')
}

/**
 * Kombiniert nur die Ergebnisse aller Artefakte (für "Alle Ergebnisse kopieren").
 */
export function buildCombinedResultsText(items: ExportArtifactItem[]): string {
  return items
    .map(({ artifact, resultText }) => {
      const header = `${artifact.artifact_code} · ${artifact.name}`
      const body = resultText ?? '(kein Ergebnis)'
      return `${header}\n${body}`
    })
    .join('\n\n---\n\n')
}
