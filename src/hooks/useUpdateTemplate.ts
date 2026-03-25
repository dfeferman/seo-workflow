import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

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
      await apiClient.templates.update(input.id, {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        phase: input.phase,
        artifact_code: input.artifact_code?.trim() || null,
        prompt_template: promptText,
        tags: input.tags?.length ? input.tags : null,
      })

      const linked = await apiClient.artifacts.getByTemplate(input.id)
      for (const row of linked) {
        await apiClient.artifacts.update(row.id as string, { prompt_template: promptText })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['artifacts'] })
    },
  })
}
