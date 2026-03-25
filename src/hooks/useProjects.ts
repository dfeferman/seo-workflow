import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ProjectRow } from '@/types/database.types'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: (): Promise<ProjectRow[]> => apiClient.projects.getAll(),
  })
}
