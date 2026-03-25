import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ArtifactRow } from '@/types/database.types'

/**
 * Löscht ein Artefakt. Durch DB CASCADE werden artifact_results und
 * artifact_dependencies automatisch mitgelöscht.
 * Optimistic Update: Artefakt wird sofort aus der Liste entfernt, bei Fehler zurückgerollt.
 */
export function useDeleteArtifact(categoryId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (artifactId: string) => {
      await apiClient.artifacts.delete(artifactId)
    },
    onMutate: async (artifactId: string) => {
      if (!categoryId) return
      const queryKey: [string, string] = ['artifacts', categoryId]
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<ArtifactRow[]>(queryKey)
      const next = prev ? prev.filter((a) => a.id !== artifactId) : undefined
      if (next !== undefined) queryClient.setQueryData(queryKey, next)
      return { prev }
    },
    onError: (_err, _artifactId, context) => {
      if (!categoryId || !context?.prev) return
      queryClient.setQueryData(['artifacts', categoryId], context.prev)
    },
    onSettled: () => {
      if (categoryId) {
        queryClient.invalidateQueries({ queryKey: ['artifacts', categoryId] })
        queryClient.invalidateQueries({ queryKey: ['artifact-status-map'] })
      }
    },
  })
}
