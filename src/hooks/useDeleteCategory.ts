import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Löscht eine Kategorie. Durch DB CASCADE werden automatisch gelöscht:
 * - Unterkategorien (parent_id = diese Kategorie)
 * - Alle Artefakte der Kategorie und ihrer Unterkategorien
 * - artifact_results und artifact_dependencies der betroffenen Artefakte
 */
export function useDeleteCategory(projectId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: (_, categoryId) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['all-categories', projectId] })
        queryClient.invalidateQueries({ queryKey: ['categories', projectId] })
      }
      queryClient.removeQueries({ queryKey: ['artifacts', categoryId] })
      queryClient.invalidateQueries({ queryKey: ['artifact-status-map'] })
    },
  })
}
