import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet.')
      const { data, error } = await supabase
        .from('phase_output_templates')
        .upsert(
          {
            user_id: user.id,
            phase: input.phase,
            template_text: input.template_text,
            description: input.description ?? null,
          },
          { onConflict: 'user_id,phase' }
        )
        .select('id')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase_output_templates'] })
    },
  })
}
