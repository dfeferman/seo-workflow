import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ArtifactRow, ArtifactPhase } from '@/types/database.types'

export type PlaceholderMap = Record<string, string>

/**
 * Lädt Artefakte der Kategorie + neueste result_text pro Artefakt, baut die Platzhalter-Map.
 */
async function fetchPlaceholderData(
  categoryId: string
): Promise<{ artifacts: ArtifactRow[]; latestByArtifactId: Map<string, string> }> {
  const list = (await apiClient.artifacts.getByCategory(categoryId)) as ArtifactRow[]
  const artifactIds = list.map((a) => a.id)
  if (artifactIds.length === 0) {
    return { artifacts: list, latestByArtifactId: new Map() }
  }
  const lists = await Promise.all(
    artifactIds.map((id) => apiClient.artifactResults.getByArtifact(id))
  )
  const latestByArtifactId = new Map<string, string>()
  lists.forEach((rows, i) => {
    const aid = artifactIds[i]!
    for (const row of rows) {
      const t = row.result_text
      if (t != null && String(t).trim() !== '' && !latestByArtifactId.has(aid)) {
        latestByArtifactId.set(aid, String(t).trim())
      }
    }
  })
  return { artifacts: list, latestByArtifactId }
}

/**
 * Baut die dynamische Platzhalter-Map für eine Kategorie:
 * - [INPUT A] … [INPUT G], [INPUT X]: alle Ergebnisse der Phase (display_order), mit \n\n verbunden
 * - [INPUT <artifact_code>]: Ergebnis des Artefakts mit diesem Code (z. B. [INPUT C1])
 * - [BRIEFING]: Ergebnis von C1
 * - [TEXT]: Ergebnis von D1
 * - [LINKS]: Ergebnis von B2 (oder B2.1 als Fallback)
 * Exportiert für Unit-Tests.
 */
export function buildDependencyMap(
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
  if (codeToText.has('B2')) result['[LINKS]'] = codeToText.get('B2')!
  else if (codeToText.has('B2.1')) result['[LINKS]'] = codeToText.get('B2.1')!

  return result
}

/** Zeilen-Format von category_phase_outputs (phase, output_text). */
export type PhaseOutputRow = { phase: string; output_text: string | null }

/**
 * Überschreibt dependencyMap mit category_phase_outputs; setzt [INPUT X], [BRIEFING], [TEXT]
 * für Phasen ohne Eintrag auf ''. (Kein Geister-Wert nach Löschen des Phase-Outputs.)
 * Exportiert für Unit-Tests.
 */
export function applyPhaseOutputOverrides(
  dependencyMap: PlaceholderMap,
  phaseOutputRows: PhaseOutputRow[]
): void {
  const seenPhases = new Set<string>()
  for (const row of phaseOutputRows) {
    if (!seenPhases.has(row.phase) && row.output_text) {
      seenPhases.add(row.phase)
      const phase = row.phase as ArtifactPhase
      dependencyMap[`[INPUT ${phase}]`] = row.output_text
      if (phase === 'C') dependencyMap['[BRIEFING]'] = row.output_text
      if (phase === 'E') dependencyMap['[TEXT]'] = row.output_text
      else if (phase === 'D' && !seenPhases.has('E')) dependencyMap['[TEXT]'] = row.output_text
    }
  }
  const allPhases = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X'] as const
  for (const phase of allPhases) {
    if (!seenPhases.has(phase)) {
      dependencyMap[`[INPUT ${phase}]`] = ''
    }
  }
  if (!seenPhases.has('C')) dependencyMap['[BRIEFING]'] = ''
  if (!seenPhases.has('D') && !seenPhases.has('E')) dependencyMap['[TEXT]'] = ''
}

/**
 * Hook: Liefert die Map dynamischer Platzhalter für eine Kategorie
 * (Oberkategorie-Platzhalter + Ergebnisse anderer Artefakte: [INPUT A], [BRIEFING], [TEXT] usw.).
 * Platzhalter der Oberkategorie gelten für Hub und alle Unterkategorien.
 */
export function usePlaceholderData(categoryId: string | undefined): {
  placeholderMap: PlaceholderMap
  latestResultByArtifactId: Record<string, string>
  isLoading: boolean
} {
  const query = useQuery({
    queryKey: ['placeholder-data', categoryId],
    queryFn: async () => {
      const category = await apiClient.categories.getById(categoryId!)
      const hubId = (category?.parent_id ?? category?.id ?? categoryId!) as string
      let hubPlaceholders: Record<string, string> = {}
      if (hubId === category?.id && category?.custom_placeholders && typeof category.custom_placeholders === 'object') {
        hubPlaceholders = { ...(category.custom_placeholders as Record<string, string>) }
      } else if (hubId !== category?.id) {
        const hub = await apiClient.categories.getById(hubId)
        if (hub?.custom_placeholders && typeof hub.custom_placeholders === 'object') {
          hubPlaceholders = { ...(hub.custom_placeholders as Record<string, string>) }
        }
      }
      const categoryPlaceholders =
        category?.id && category.id !== hubId && category?.custom_placeholders && typeof category.custom_placeholders === 'object'
          ? (category.custom_placeholders as Record<string, string>)
          : {}
      const { artifacts, latestByArtifactId } = await fetchPlaceholderData(categoryId!)
      const dependencyMap = buildDependencyMap(artifacts, latestByArtifactId)

      const phaseRowsRaw = await apiClient.categoryPhaseOutputs.getByCategory(categoryId!)
      const phaseOutputRows = [...phaseRowsRaw].sort(
        (a, b) => (b.version ?? 0) - (a.version ?? 0)
      )
      applyPhaseOutputOverrides(
        dependencyMap,
        phaseOutputRows.map((r) => ({ phase: String(r.phase), output_text: r.output_text ?? null }))
      )

      const placeholderMap: PlaceholderMap = { ...hubPlaceholders, ...categoryPlaceholders, ...dependencyMap }
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
