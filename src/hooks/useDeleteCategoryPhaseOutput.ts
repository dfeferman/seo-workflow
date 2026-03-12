import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ArtifactPhase } from '@/types/database.types'

export type DeleteCategoryPhaseOutputInput = {
  categoryId: string
  phase: ArtifactPhase
}

/**
 * Kompilierten Phase-Output einer Kategorie + Phase löschen (alle Versionen).
 * artifact_results bleiben erhalten; Output kann neu generiert werden.
 */
export function useDeleteCategoryPhaseOutput() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteCategoryPhaseOutputInput) => {
      const { error } = await supabase
        .from('category_phase_outputs')
        .delete()
        .eq('category_id', input.categoryId)
        .eq('phase', input.phase)
      if (error) throw error
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
