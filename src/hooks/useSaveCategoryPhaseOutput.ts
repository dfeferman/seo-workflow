import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
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
      return apiClient.categoryPhaseOutputs.create({
        category_id: input.categoryId,
        phase: input.phase,
        output_text: input.outputText,
        status: input.status ?? 'draft',
      })
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
