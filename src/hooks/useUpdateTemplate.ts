import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type UpdateTemplateInput = {
  id: string
  name: string
  description: string | null
  phase: string
  artifact_code: string | null
  prompt_template: string
  tags: string[] | null
}

/**
 * Template in der Bibliothek aktualisieren und prompt_template in allen
 * verknüpften Artefakten (template_id = id) synchronisieren.
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTemplateInput) => {
      const promptText = input.prompt_template?.trim() || ' '
      const { error: templateError } = await supabase
        .from('templates')
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          phase: input.phase,
          artifact_code: input.artifact_code?.trim() || null,
          prompt_template: promptText,
          tags: input.tags?.length ? input.tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
      if (templateError) throw templateError

      // Sync: alle Artefakte mit diesem Template auf den neuen Prompt-Text setzen
      const { error: syncError } = await supabase
        .from('artifacts')
        .update({
          prompt_template: promptText,
          updated_at: new Date().toISOString(),
        })
        .eq('template_id', input.id)
      if (syncError) throw syncError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['artifacts'] })
    },
  })
}
