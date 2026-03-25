import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ArtifactRow } from '@/types/database.types'

export type ArtifactStatus = 'done' | 'active' | 'open'

/** Artefakte einer Kategorie, sortiert nach display_order. */
export function useArtifacts(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['artifacts', categoryId],
    queryFn: async (): Promise<ArtifactRow[]> => {
      if (!categoryId) return []
      return apiClient.artifacts.getByCategory(categoryId)
    },
    enabled: !!categoryId,
  })
}

/** Pro Artefakt: 'done' (final), 'active' (draft), 'open' (kein Ergebnis). */
export type ArtifactStatusMap = Record<string, ArtifactStatus>

/**
 * Ermittelt für alle Artefakte einer Kategorie den Status aus artifact_results.
 * done = mind. ein Ergebnis mit status 'final'
 * active = mind. ein Ergebnis mit status 'draft', kein final
 * open = kein Ergebnis
 */
export function useArtifactStatusMap(
  categoryId: string | undefined,
  artifactIds: string[]
) {
  return useQuery({
    queryKey: ['artifact-status-map', categoryId, artifactIds],
    queryFn: async (): Promise<ArtifactStatusMap> => {
      if (!categoryId || artifactIds.length === 0) return {}
      const lists = await Promise.all(
        artifactIds.map((id) => apiClient.artifactResults.getByArtifact(id))
      )
      const map: ArtifactStatusMap = {}
      for (const id of artifactIds) map[id] = 'open'
      lists.forEach((rows, i) => {
        const id = artifactIds[i]!
        for (const r of rows) {
          const st = r.status as string
          if (st === 'final') map[id] = 'done'
          else if (map[id] !== 'done') map[id] = 'active'
        }
      })
      return map
    },
    enabled: !!categoryId && artifactIds.length > 0,
  })
}
