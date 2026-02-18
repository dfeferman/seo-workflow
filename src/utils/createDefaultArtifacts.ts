import type { ArtifactPhase } from '@/types/database.types'
import type { ArtifactInsert } from '@/types/database.types'

export type DefaultArtifactSpec = {
  phase: ArtifactPhase
  artifact_code: string
  name: string
  prompt_template: string
  display_order: number
}

/** 18 Standard-Artefakte für Shop-Kategorien (Phase A–F). */
export const CATEGORY_DEFAULT_ARTIFACTS: DefaultArtifactSpec[] = [
  { phase: 'A', artifact_code: 'A1', name: 'Analyse Kategorie', prompt_template: 'Arbeitsanweisung für [A1]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 0 },
  { phase: 'A', artifact_code: 'A1.2', name: 'Analyse Vertiefung', prompt_template: 'Arbeitsanweisung für [A1.2]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 1 },
  { phase: 'A', artifact_code: 'A2.1', name: 'Struktur 1', prompt_template: 'Arbeitsanweisung für [A2.1]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 2 },
  { phase: 'A', artifact_code: 'A2.2', name: 'Struktur 2', prompt_template: 'Arbeitsanweisung für [A2.2]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 3 },
  { phase: 'B', artifact_code: 'B1', name: 'Recherche 1', prompt_template: 'Arbeitsanweisung für [B1]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 4 },
  { phase: 'B', artifact_code: 'B2', name: 'Recherche 2', prompt_template: 'Arbeitsanweisung für [B2]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 5 },
  { phase: 'B', artifact_code: 'B2.1', name: 'Recherche 2.1', prompt_template: 'Arbeitsanweisung für [B2.1]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 6 },
  { phase: 'C', artifact_code: 'C1', name: 'Briefing', prompt_template: 'Arbeitsanweisung für [C1]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 7 },
  { phase: 'C', artifact_code: 'C2', name: 'Konzept', prompt_template: 'Arbeitsanweisung für [C2]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 8 },
  { phase: 'D', artifact_code: 'D1', name: 'Text 1', prompt_template: 'Arbeitsanweisung für [D1]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 9 },
  { phase: 'D', artifact_code: 'D2', name: 'Text 2', prompt_template: 'Arbeitsanweisung für [D2]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 10 },
  { phase: 'E', artifact_code: 'E1', name: 'Review 1', prompt_template: 'Arbeitsanweisung für [E1]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 11 },
  { phase: 'E', artifact_code: 'E2', name: 'Review 2', prompt_template: 'Arbeitsanweisung für [E2]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 12 },
  { phase: 'F', artifact_code: 'F1', name: 'Meta 1', prompt_template: 'Arbeitsanweisung für [F1]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 13 },
  { phase: 'F', artifact_code: 'F2', name: 'Meta 2', prompt_template: 'Arbeitsanweisung für [F2]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 14 },
  { phase: 'F', artifact_code: 'F3', name: 'Meta 3', prompt_template: 'Arbeitsanweisung für [F3]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 15 },
  { phase: 'F', artifact_code: 'F4', name: 'Meta 4', prompt_template: 'Arbeitsanweisung für [F4]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 16 },
  { phase: 'F', artifact_code: 'F5', name: 'Abschluss', prompt_template: 'Arbeitsanweisung für [F5]: Nutze [KATEGORIE] und [ZIELGRUPPEN].', display_order: 17 },
]

/** 12 reduzierte Artefakte für Blog-Artikel. */
export const BLOG_DEFAULT_ARTIFACTS: DefaultArtifactSpec[] = [
  { phase: 'A', artifact_code: 'A1', name: 'Analyse Kategorie', prompt_template: 'Blog: [A1] für [KATEGORIE] und [ZIELGRUPPEN].', display_order: 0 },
  { phase: 'A', artifact_code: 'A2.1', name: 'Struktur 1', prompt_template: 'Blog: [A2.1] für [KATEGORIE].', display_order: 1 },
  { phase: 'B', artifact_code: 'B1', name: 'Recherche 1', prompt_template: 'Blog: [B1] für [KATEGORIE].', display_order: 2 },
  { phase: 'B', artifact_code: 'B2', name: 'Recherche 2', prompt_template: 'Blog: [B2] für [KATEGORIE].', display_order: 3 },
  { phase: 'C', artifact_code: 'C1', name: 'Briefing', prompt_template: 'Blog: [C1] für [KATEGORIE] und [ZIELGRUPPEN].', display_order: 4 },
  { phase: 'C', artifact_code: 'C2', name: 'Konzept', prompt_template: 'Blog: [C2] für [KATEGORIE].', display_order: 5 },
  { phase: 'D', artifact_code: 'D1', name: 'Text 1', prompt_template: 'Blog: [D1] für [KATEGORIE].', display_order: 6 },
  { phase: 'E', artifact_code: 'E1', name: 'Review 1', prompt_template: 'Blog: [E1] für [KATEGORIE].', display_order: 7 },
  { phase: 'E', artifact_code: 'E2', name: 'Review 2', prompt_template: 'Blog: [E2] für [KATEGORIE].', display_order: 8 },
  { phase: 'F', artifact_code: 'F1', name: 'Meta 1', prompt_template: 'Blog: [F1] für [KATEGORIE].', display_order: 9 },
  { phase: 'F', artifact_code: 'F2', name: 'Meta 2', prompt_template: 'Blog: [F2] für [KATEGORIE].', display_order: 10 },
  { phase: 'F', artifact_code: 'F3', name: 'Meta 3', prompt_template: 'Blog: [F3] für [KATEGORIE].', display_order: 11 },
]

export function getDefaultArtifactsForCategory(categoryId: string, type: 'category' | 'blog'): Omit<ArtifactInsert, 'id' | 'created_at' | 'updated_at'>[] {
  const specs = type === 'category' ? CATEGORY_DEFAULT_ARTIFACTS : BLOG_DEFAULT_ARTIFACTS
  return specs.map((s) => ({
    category_id: categoryId,
    phase: s.phase,
    artifact_code: s.artifact_code,
    name: s.name,
    prompt_template: s.prompt_template,
    display_order: s.display_order,
  }))
}
