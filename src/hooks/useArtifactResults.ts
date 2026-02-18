import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ArtifactResultRow } from '@/types/database.types'

export function useArtifactResults(artifactId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['artifact-results', artifactId],
    queryFn: async (): Promise<ArtifactResultRow[]> => {
      if (!artifactId) return []
      const { data, error } = await supabase
        .from('artifact_results')
        .select('*')
        .eq('artifact_id', artifactId)
        .order('version', { ascending: false })
      if (error) throw error
      return data ?? []
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
      const { data: existing } = await supabase
        .from('artifact_results')
        .select('version')
        .eq('artifact_id', artifact_id)
        .order('version', { ascending: false })
        .limit(1)
        .single()
      const nextVersion = (existing?.version ?? 0) + 1
      const { data, error } = await supabase
        .from('artifact_results')
        .insert({
          artifact_id,
          result_text,
          source,
          version: nextVersion,
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, { artifact_id }) => {
      void queryClient.invalidateQueries({ queryKey: ['artifact-results', artifact_id] })
      void queryClient.invalidateQueries({ queryKey: ['artifact-status-map'] })
      void queryClient.invalidateQueries({ queryKey: ['category-progress'] })
      void queryClient.invalidateQueries({ queryKey: ['placeholder-data'] })
    },
  })

  const setResultFinal = useMutation({
    mutationFn: async ({
      result_id,
    }: {
      result_id: string
      artifact_id: string
    }) => {
      const { error } = await supabase
        .from('artifact_results')
        .update({ status: 'final' })
        .eq('id', result_id)
      if (error) throw error
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
