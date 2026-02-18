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

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTemplateInput) => {
      const { error } = await supabase
        .from('templates')
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          phase: input.phase,
          artifact_code: input.artifact_code?.trim() || null,
          prompt_template: input.prompt_template?.trim() || ' ',
          tags: input.tags?.length ? input.tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
