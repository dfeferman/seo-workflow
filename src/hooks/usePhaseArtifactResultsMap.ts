import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ArtifactPhase } from '@/types/database.types'

/**
 * Lädt die neueste result_text pro artifact_code für eine gegebene Kategorie + Phase.
 * Wird beim Kompilieren des Phase-Outputs verwendet.
 */
export function usePhaseArtifactResultsMap(categoryId: string, phase: ArtifactPhase) {
  return useQuery({
    queryKey: ['phase-artifact-results-map', categoryId, phase],
    queryFn: async (): Promise<Map<string, string>> => {
      const allArts = await apiClient.artifacts.getByCategory(categoryId)
      const artifacts = allArts.filter(
        (a) => String(a.phase).toUpperCase() === String(phase).toUpperCase()
      )
      if (!artifacts.length) return new Map()

      const artifactIds = artifacts.map((a) => a.id as string)
      const resultLists = await Promise.all(
        artifactIds.map((id) => apiClient.artifactResults.getByArtifact(id))
      )

      const latestByArtifactId = new Map<string, string>()
      resultLists.forEach((rows, i) => {
        const aid = artifactIds[i]!
        for (const r of rows) {
          if (!latestByArtifactId.has(aid) && r.result_text) {
            latestByArtifactId.set(aid, r.result_text as string)
            break
          }
        }
      })

      const map = new Map<string, string>()
      for (const a of artifacts) {
        const text = latestByArtifactId.get(a.id as string)
        if (text) map.set(a.artifact_code as string, text)
      }
      return map
    },
    enabled: !!categoryId,
  })
}
