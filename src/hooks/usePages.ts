import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PageRow } from '@/types/database.types'

export function usePages(projectId: string | undefined) {
  return useQuery({
    queryKey: ['pages', projectId],
    queryFn: async (): Promise<PageRow[]> => {
      if (!projectId) return []
      return apiClient.pages.getByProject(projectId)
    },
    enabled: !!projectId,
  })
}
