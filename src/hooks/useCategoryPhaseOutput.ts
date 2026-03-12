import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ArtifactPhase, CategoryPhaseOutputRow } from '@/types/database.types'

/**
 * Neuester kompilierter Phase-Output für eine Kategorie + Phase.
 * Gibt null zurück wenn noch kein Output existiert.
 */
export function useCategoryPhaseOutput(categoryId: string, phase: ArtifactPhase) {
  return useQuery({
    queryKey: ['category_phase_outputs', categoryId, phase],
    queryFn: async (): Promise<CategoryPhaseOutputRow | null> => {
      const { data, error } = await supabase
        .from('category_phase_outputs')
        .select('*')
        .eq('category_id', categoryId)
        .eq('phase', phase)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
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
      const { data, error } = await supabase
        .from('category_phase_outputs')
        .select('phase, output_text, version')
        .eq('category_id', categoryId)
        .order('version', { ascending: false })
      if (error) throw error

      // Pro Phase nur die neueste Version behalten
      const result = {} as Record<ArtifactPhase, string>
      const seen = new Set<string>()
      for (const row of (data ?? [])) {
        if (!seen.has(row.phase)) {
          seen.add(row.phase)
          result[row.phase as ArtifactPhase] = row.output_text ?? ''
        }
      }
      return result
    },
    enabled: !!categoryId,
  })
}
