import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { CategoryRow } from '@/types/database.types'

export function useCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async (): Promise<CategoryRow | null> => {
      if (!categoryId) return null
      return apiClient.categories.getById(categoryId)
    },
    enabled: !!categoryId,
  })
}
