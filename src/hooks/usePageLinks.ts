import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PageLinkRow } from '@/types/database.types'

export function usePageLinks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['page-links', projectId],
    queryFn: async (): Promise<PageLinkRow[]> => {
      if (!projectId) return []
      return apiClient.pageLinks.getByProject(projectId)
    },
    enabled: !!projectId,
  })
}
