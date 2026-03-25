import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { CategoryRow } from '@/types/database.types'

/**
 * Unterkategorien (Kinder) einer Kategorie (parent_id = categoryId).
 * Lädt alle Kategorien des Projekts und filtert clientseitig.
 */
export function useSubcategories(projectId: string | undefined, categoryId: string | undefined) {
  return useQuery({
    queryKey: ['subcategories', projectId, categoryId],
    queryFn: async (): Promise<CategoryRow[]> => {
      if (!projectId || !categoryId) return []
      const all = await apiClient.categories.getByProject(projectId)
      return all
        .filter((c: CategoryRow) => c.parent_id != null && String(c.parent_id) === String(categoryId))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    },
    enabled: !!projectId && !!categoryId,
  })
}
