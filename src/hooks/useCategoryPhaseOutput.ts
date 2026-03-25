import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ArtifactPhase, CategoryPhaseOutputRow } from '@/types/database.types'

/**
 * Neuester kompilierter Phase-Output für eine Kategorie + Phase.
 * Gibt null zurück wenn noch kein Output existiert.
 */
export function useCategoryPhaseOutput(categoryId: string, phase: ArtifactPhase) {
  return useQuery({
    queryKey: ['category_phase_outputs', categoryId, phase],
    queryFn: async (): Promise<CategoryPhaseOutputRow | null> => {
      const rows = await apiClient.categoryPhaseOutputs.getByCategory(categoryId)
      const forPhase = rows
        .filter((r) => String(r.phase) === String(phase))
        .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
      return (forPhase[0] as CategoryPhaseOutputRow) ?? null
    },
    enabled: !!categoryId,
  })
}

/**
 * Alle Phase-Outputs einer Kategorie (alle Phasen, neueste Version je Phase).
 * Wird für Placeholder-Substitution in Nachfolgephasen verwendet.
 */
export function useCategoryPhaseOutputs(categoryId: string) {
  return useQuery({
    queryKey: ['category_phase_outputs', categoryId],
    queryFn: async (): Promise<Record<ArtifactPhase, string>> => {
      const data = await apiClient.categoryPhaseOutputs.getByCategory(categoryId)
      const result = {} as Record<ArtifactPhase, string>
      const seen = new Set<string>()
      for (const row of data) {
        const ph = String(row.phase)
        if (!seen.has(ph)) {
          seen.add(ph)
          result[ph as ArtifactPhase] = row.output_text ?? ''
        }
      }
      return result
    },
    enabled: !!categoryId,
  })
}
