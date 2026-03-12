import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type ArtifactUpdate = Database['public']['Tables']['artifacts']['Update']

export type UpdateArtifactInput = {
  id: string
  categoryId: string
} & Partial<Pick<ArtifactUpdate, 'name' | 'description' | 'prompt_template' | 'phase' | 'artifact_code' | 'recommended_source' | 'estimated_duration_minutes' | 'display_order' | 'template_id'>>

/**
 * Artefakt aktualisieren (z. B. prompt_template, name, description).
 */
export function useUpdateArtifact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateArtifactInput) => {
      const { id, categoryId, ...payload } = input
      const update: ArtifactUpdate = {
        ...payload,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('artifacts')
        .update(update)
        .eq('id', id)
      if (error) throw error
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
