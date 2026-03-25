import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ArtifactPhase } from '@/types/database.types'

export type SavePhaseOutputTemplateInput = {
  phase: ArtifactPhase
  template_text: string
  description?: string | null
}

/**
 * Phase-Output-Template anlegen oder aktualisieren (upsert per phase).
 */
export function useSavePhaseOutputTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SavePhaseOutputTemplateInput) => {
      return apiClient.phaseOutputTemplates.upsert(input.phase, {
        template_text: input.template_text,
        ...(input.description != null ? { description: input.description } : {}),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase_output_templates'] })
    },
  })
}
