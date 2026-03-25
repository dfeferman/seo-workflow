import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

/**
 * Template löschen. Zuerst template_id bei allen verknüpften Artefakten
 * auf null setzen (prompt_template bleibt als Kopie), dann Template entfernen.
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      const linked = await apiClient.artifacts.getByTemplate(templateId)
      for (const row of linked) {
        await apiClient.artifacts.update(row.id as string, { template_id: null })
      }
      await apiClient.templates.delete(templateId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['artifacts'] })
    },
  })
}
