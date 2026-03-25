import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ProjectRow } from '@/types/database.types'

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<ProjectRow | null> => {
      if (!projectId) return null
      return apiClient.projects.getById(projectId)
    },
    enabled: !!projectId,
  })
}
