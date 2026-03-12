import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Template löschen. Zuerst template_id bei allen verknüpften Artefakten
 * auf null setzen (prompt_template bleibt als Kopie), dann Template entfernen.
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error: unlinkError } = await supabase
        .from('artifacts')
        .update({
          template_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('template_id', templateId)
      if (unlinkError) throw unlinkError

      const { error } = await supabase.from('templates').delete().eq('id', templateId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['artifacts'] })
    },
  })
}
