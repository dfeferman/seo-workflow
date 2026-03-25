import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

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
      return apiClient.templates.create({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        phase: input.phase,
        artifact_code: input.artifact_code || null,
        prompt_template: input.prompt_template || ' ',
        tags: input.tags?.length ? input.tags : null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  return mutation
}
