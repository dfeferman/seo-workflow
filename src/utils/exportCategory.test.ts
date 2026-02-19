import { describe, it, expect } from 'vitest'
import {
  buildCategoryMarkdown,
  buildCombinedResultsText,
  type ExportArtifactItem,
} from './exportCategory'
import type { ArtifactRow } from '@/types/database.types'

function artifact(overrides: Partial<ArtifactRow> = {}): ArtifactRow {
  return {
    id: 'art-1',
    category_id: 'cat-1',
    phase: 'A',
    artifact_code: 'A1',
    name: 'Analyse',
    description: null,
    prompt_template: 'Template',
    recommended_source: null,
    estimated_duration_minutes: null,
    display_order: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function exportItem(
  overrides: Partial<ExportArtifactItem> = {}
): ExportArtifactItem {
  return {
    artifact: artifact(),
    resolvedPrompt: 'Resolved prompt',
    resultText: 'Ergebnis-Text',
    ...overrides,
  }
}

describe('buildCategoryMarkdown', () => {
  it('enthält Kategoriename und Export-Datum', () => {
    const md = buildCategoryMarkdown('Meine Kategorie', [])
    expect(md).toContain('# Meine Kategorie')
    expect(md).toContain('Export:')
    expect(md).toContain('---')
  })

  it('fügt pro Artefakt Überschrift, Prompt und Ergebnis ein', () => {
    const items: ExportArtifactItem[] = [
      exportItem({
        artifact: artifact({ artifact_code: 'A1', name: 'Analyse' }),
        resolvedPrompt: 'Prompt A1',
        resultText: 'Ergebnis A1',
      }),
    ]
    const md = buildCategoryMarkdown('Kategorie', items)
    expect(md).toContain('## A1 · Analyse')
    expect(md).toContain('### Prompt')
    expect(md).toContain('```')
    expect(md).toContain('Prompt A1')
    expect(md).toContain('### Ergebnis')
    expect(md).toContain('Ergebnis A1')
  })

  it('zeigt "(kein Ergebnis)" bei null resultText', () => {
    const items = [exportItem({ resultText: null })]
    const md = buildCategoryMarkdown('K', items)
    expect(md).toContain('(kein Ergebnis)')
  })

  it('fügt description ein wenn vorhanden', () => {
    const items = [
      exportItem({
        artifact: artifact({ description: 'Beschreibung des Artefakts' }),
      }),
    ]
    const md = buildCategoryMarkdown('K', items)
    expect(md).toContain('Beschreibung des Artefakts')
  })
})

describe('buildCombinedResultsText', () => {
  it('kombiniert Header und Ergebnis pro Artefakt', () => {
    const items = [
      exportItem({
        artifact: artifact({ artifact_code: 'A1', name: 'Analyse' }),
        resultText: 'Text 1',
      }),
      exportItem({
        artifact: artifact({ artifact_code: 'B1', name: 'Recherche' }),
        resultText: 'Text 2',
      }),
    ]
    const text = buildCombinedResultsText(items)
    expect(text).toContain('A1 · Analyse')
    expect(text).toContain('Text 1')
    expect(text).toContain('B1 · Recherche')
    expect(text).toContain('Text 2')
    expect(text).toContain('---')
  })

  it('nutzt "(kein Ergebnis)" bei null resultText', () => {
    const items = [exportItem({ resultText: null })]
    expect(buildCombinedResultsText(items)).toContain('(kein Ergebnis)')
  })

  it('gibt leeren String bei leerem Array zurück', () => {
    expect(buildCombinedResultsText([])).toBe('')
  })
})
