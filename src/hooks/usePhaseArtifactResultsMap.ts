import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ArtifactPhase } from '@/types/database.types'

/**
 * Lädt die neueste result_text pro artifact_code für eine gegebene Kategorie + Phase.
 * Wird beim Kompilieren des Phase-Outputs verwendet.
 */
export function usePhaseArtifactResultsMap(categoryId: string, phase: ArtifactPhase) {
  return useQuery({
    queryKey: ['phase-artifact-results-map', categoryId, phase],
    queryFn: async (): Promise<Map<string, string>> => {
      const { data: artifacts, error: artError } = await supabase
        .from('artifacts')
        .select('id, artifact_code')
        .eq('category_id', categoryId)
        .eq('phase', phase)
      if (artError) throw artError
      if (!artifacts?.length) return new Map()

      const artifactIds = artifacts.map((a) => a.id)
      const { data: results, error: resError } = await supabase
        .from('artifact_results')
        .select('artifact_id, result_text, version')
        .in('artifact_id', artifactIds)
        .order('version', { ascending: false })
      if (resError) throw resError

      // Pro artifact_id nur die neueste Version mit Text behalten
      const latestByArtifactId = new Map<string, string>()
      for (const r of results ?? []) {
        if (!latestByArtifactId.has(r.artifact_id) && r.result_text) {
          latestByArtifactId.set(r.artifact_id, r.result_text)
        }
      }

      const map = new Map<string, string>()
      for (const a of artifacts) {
        const text = latestByArtifactId.get(a.id)
        if (text) map.set(a.artifact_code, text)
      }
      return map
    },
    enabled: !!categoryId,
  })
}
