import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
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
      const rows = await apiClient.categoryPhaseOutputs.getByCategory(input.categoryId)
      const toDelete = rows.filter((r) => String(r.phase) === String(input.phase))
      for (const r of toDelete) {
        await apiClient.categoryPhaseOutputs.delete(r.id as string)
      }
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
