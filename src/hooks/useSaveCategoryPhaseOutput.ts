import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ArtifactPhase, ResultStatus } from '@/types/database.types'

export type SaveCategoryPhaseOutputInput = {
  categoryId: string
  phase: ArtifactPhase
  outputText: string
  status?: ResultStatus
}

/**
 * Neuen kompilierten Phase-Output speichern (erzeugt immer eine neue Version).
 */
export function useSaveCategoryPhaseOutput() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaveCategoryPhaseOutputInput) => {
      // Aktuelle höchste Version ermitteln
      const { data: latest, error: fetchError } = await supabase
        .from('category_phase_outputs')
        .select('version')
        .eq('category_id', input.categoryId)
        .eq('phase', input.phase)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (fetchError) throw fetchError

      const nextVersion = (latest?.version ?? 0) + 1

      const { data, error } = await supabase
        .from('category_phase_outputs')
        .insert({
          category_id: input.categoryId,
          phase: input.phase,
          output_text: input.outputText,
          version: nextVersion,
          status: input.status ?? 'draft',
        })
        .select('id, version')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['category_phase_outputs', variables.categoryId],
      })
      queryClient.invalidateQueries({
        queryKey: ['placeholder-data', variables.categoryId],
      })
    },
  })
}
