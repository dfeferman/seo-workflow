import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ArtifactResultRow } from '@/types/database.types'

export function useArtifactResults(artifactId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['artifact-results', artifactId],
    queryFn: async (): Promise<ArtifactResultRow[]> => {
      if (!artifactId) return []
      return apiClient.artifactResults.getByArtifact(artifactId)
    },
    enabled: !!artifactId,
  })

  const saveResult = useMutation({
    mutationFn: async ({
      artifact_id,
      result_text,
      source = 'manual',
    }: {
      artifact_id: string
      result_text: string
      source?: string
    }) => {
      return apiClient.artifactResults.create({ artifact_id, result_text, source })
    },
    onSuccess: (_data, { artifact_id }) => {
      void queryClient.invalidateQueries({ queryKey: ['artifact-results', artifact_id] })
      void queryClient.invalidateQueries({ queryKey: ['artifact-status-map'] })
      void queryClient.invalidateQueries({ queryKey: ['category-progress'] })
      void queryClient.invalidateQueries({ queryKey: ['placeholder-data'] })
    },
  })

  const setResultFinal = useMutation({
    mutationFn: async ({ result_id }: { result_id: string; artifact_id: string }) => {
      await apiClient.artifactResults.update(result_id, { status: 'final' })
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['artifact-results', variables.artifact_id] })
      void queryClient.invalidateQueries({ queryKey: ['artifact-status-map'] })
      void queryClient.invalidateQueries({ queryKey: ['category-progress'] })
      void queryClient.invalidateQueries({ queryKey: ['placeholder-data'] })
    },
  })

  const latestResult = query.data?.[0] ?? null

  return {
    results: query.data ?? [],
    latestResult,
    isLoading: query.isLoading,
    saveResult: saveResult.mutateAsync,
    setResultFinal: (resultId: string, artifact_id: string) =>
      setResultFinal.mutateAsync({ result_id: resultId, artifact_id }),
  }
}
