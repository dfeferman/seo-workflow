import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Löscht ein Artefakt. Durch DB CASCADE werden artifact_results und
 * artifact_dependencies automatisch mitgelöscht.
 */
export function useDeleteArtifact(categoryId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (artifactId: string) => {
      const { error } = await supabase.from('artifacts').delete().eq('id', artifactId)
      if (error) throw error
    },
    onSuccess: () => {
      if (categoryId) {
        queryClient.invalidateQueries({ queryKey: ['artifacts', categoryId] })
        queryClient.invalidateQueries({ queryKey: ['artifact-status-map'] })
      }
    },
  })
}
