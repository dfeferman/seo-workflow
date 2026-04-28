import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { CategoryRow } from '@/types/database.types'

/** Pro Kategorie: Menge der Phasen (A–X), in denen Artefakte existieren. */
export function useProjectCategoryPhases(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-category-phases', projectId],
    queryFn: async (): Promise<Map<string, Set<string>>> => {
      const cats = (await apiClient.categories.getByProject(projectId!)) as CategoryRow[]
      const map = new Map<string, Set<string>>()
      await Promise.all(
        cats.map(async (c) => {
          const arts = (await apiClient.artifacts.getByCategory(c.id)) as { phase?: string }[]
          const phases = new Set<string>()
          for (const a of arts) {
            if (a.phase != null && String(a.phase).trim() !== '') {
              phases.add(String(a.phase).toUpperCase().slice(0, 1))
            }
          }
          map.set(c.id, phases)
        })
      )
      return map
    },
    enabled: !!projectId,
  })
}
