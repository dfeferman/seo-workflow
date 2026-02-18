import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ArtifactRow } from '@/types/database.types'

export type PlaceholderMap = Record<string, string>

/**
 * Lädt Artefakte der Kategorie + neueste result_text pro Artefakt, baut die Platzhalter-Map.
 */
async function fetchPlaceholderData(
  categoryId: string
): Promise<{ artifacts: ArtifactRow[]; latestByArtifactId: Map<string, string> }> {
  const { data: artifacts, error: e1 } = await supabase
    .from('artifacts')
    .select('*')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: true })
  if (e1) throw e1
  const list = artifacts ?? []
  const artifactIds = list.map((a) => a.id)
  if (artifactIds.length === 0) {
    return { artifacts: list, latestByArtifactId: new Map() }
  }
  const { data: results, error: e2 } = await supabase
    .from('artifact_results')
    .select('artifact_id, result_text, version')
    .in('artifact_id', artifactIds)
    .order('version', { ascending: false })
  if (e2) throw e2
  const latestByArtifactId = new Map<string, string>()
  for (const row of results ?? []) {
    if (!latestByArtifactId.has(row.artifact_id) && row.result_text != null && row.result_text.trim() !== '') {
      latestByArtifactId.set(row.artifact_id, row.result_text.trim())
    }
  }
  return { artifacts: list, latestByArtifactId }
}

/**
 * Baut die dynamische Platzhalter-Map für eine Kategorie:
 * - [INPUT A] … [INPUT G], [INPUT X]: alle Ergebnisse der Phase (display_order), mit \n\n verbunden
 * - [INPUT <artifact_code>]: Ergebnis des Artefakts mit diesem Code (z. B. [INPUT C1])
 * - [BRIEFING]: Ergebnis von C1
 * - [TEXT]: Ergebnis von D1
 */
function buildDependencyMap(
  artifacts: ArtifactRow[],
  latestByArtifactId: Map<string, string>
): PlaceholderMap {
  const codeToText = new Map<string, string>()
  for (const a of artifacts) {
    const text = latestByArtifactId.get(a.id)
    if (text != null) codeToText.set(a.artifact_code, text)
  }

  const phaseToArtifacts = new Map<string, ArtifactRow[]>()
  for (const a of artifacts) {
    const list = phaseToArtifacts.get(a.phase) ?? []
    list.push(a)
    phaseToArtifacts.set(a.phase, list)
  }
  for (const list of phaseToArtifacts.values()) {
    list.sort((x, y) => x.display_order - y.display_order)
  }

  const result: PlaceholderMap = {}

  for (const [code, text] of codeToText) {
    result[`[INPUT ${code}]`] = text
  }

  const phaseOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X'] as const
  for (const phase of phaseOrder) {
    const list = phaseToArtifacts.get(phase) ?? []
    const parts = list
      .map((a) => latestByArtifactId.get(a.id))
      .filter((t): t is string => t != null && t.length > 0)
    result[`[INPUT ${phase}]`] = parts.join('\n\n')
  }

  if (codeToText.has('C1')) result['[BRIEFING]'] = codeToText.get('C1')!
  if (codeToText.has('D1')) result['[TEXT]'] = codeToText.get('D1')!

  return result
}

/**
 * Hook: Liefert die Map dynamischer Platzhalter für eine Kategorie
 * (Ergebnisse anderer Artefakte: [INPUT A], [BRIEFING], [TEXT], [INPUT C1] usw.).
 * Für die statischen Platzhalter ([KATEGORIE] usw.) wird weiterhin replacePlaceholders(template, category, dependencyMap) verwendet.
 */
export function usePlaceholderData(categoryId: string | undefined): {
  placeholderMap: PlaceholderMap
  isLoading: boolean
} {
  const query = useQuery({
    queryKey: ['placeholder-data', categoryId],
    queryFn: async () => {
      const { artifacts, latestByArtifactId } = await fetchPlaceholderData(categoryId!)
      const placeholderMap = buildDependencyMap(artifacts, latestByArtifactId)
      const latestResultByArtifactId = Object.fromEntries(latestByArtifactId)
      return { placeholderMap, latestResultByArtifactId }
    },
    enabled: !!categoryId,
  })

  const data = query.data
  return {
    placeholderMap: data?.placeholderMap ?? {},
    latestResultByArtifactId: (data?.latestResultByArtifactId ?? {}) as Record<string, string>,
    isLoading: query.isLoading,
  }
}
