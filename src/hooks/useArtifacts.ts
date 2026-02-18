import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ArtifactRow } from '@/types/database.types'

export type ArtifactStatus = 'done' | 'active' | 'open'

/** Artefakte einer Kategorie, sortiert nach display_order. */
export function useArtifacts(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['artifacts', categoryId],
    queryFn: async (): Promise<ArtifactRow[]> => {
      if (!categoryId) return []
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data ?? []
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
      const { data: results, error } = await supabase
        .from('artifact_results')
        .select('artifact_id, status')
        .in('artifact_id', artifactIds)
      if (error) throw error
      const map: ArtifactStatusMap = {}
      for (const id of artifactIds) map[id] = 'open'
      for (const r of results ?? []) {
        const current = map[r.artifact_id]
        if (r.status === 'final') map[r.artifact_id] = 'done'
        else if (current !== 'done') map[r.artifact_id] = 'active'
      }
      return map
    },
    enabled: !!categoryId && artifactIds.length > 0,
  })
}
