import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

export type UpdateArtifactInput = {
  id: string
  categoryId: string
} & Partial<{
  name: string
  description: string | null
  prompt_template: string
  phase: string
  artifact_code: string
  recommended_source: string | null
  estimated_duration_minutes: number | null
  display_order: number
  template_id: string | null
}>

/**
 * Artefakt aktualisieren (z. B. prompt_template, name, description).
 */
export function useUpdateArtifact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateArtifactInput) => {
      const { id, categoryId: _categoryId, ...payload } = input
      await apiClient.artifacts.update(id, payload)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['artifacts', variables.categoryId],
      })
      queryClient.invalidateQueries({
        queryKey: ['artifact-status-map', variables.categoryId],
      })
    },
  })
}
