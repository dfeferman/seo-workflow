import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type SaveTemplateInput = {
  name: string
  description: string | null
  phase: string
  artifact_code: string | null
  prompt_template: string
  tags: string[] | null
}

export function useSaveTemplate() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (input: SaveTemplateInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet.')
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          phase: input.phase,
          artifact_code: input.artifact_code || null,
          prompt_template: input.prompt_template || ' ',
          tags: input.tags?.length ? input.tags : null,
        })
        .select('id')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  return mutation
}
