import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useCategories } from './useCategories'

export type CategoryProgressMap = Record<string, { done: number; total: number }>

/**
 * Pro Kategorie die Anzahl Artefakte (total) und erledigte (done).
 * @param projectId – Projekt
 * @param categoryIdsOverride – wenn gesetzt: nur diese IDs (z. B. inkl. Unterkategorien); sonst nur Top-Level-Kategorien
 */
export function useCategoryProgress(
  projectId: string | undefined,
  categoryIdsOverride?: string[]
): CategoryProgressMap {
  const { data: categories } = useCategories(projectId)
  const categoryIds = categoryIdsOverride ?? categories?.map((c) => c.id) ?? []

  const { data: result } = useQuery({
    queryKey: ['category-progress', projectId, categoryIds],
    queryFn: async () => {
      if (categoryIds.length === 0) {
        return { artifacts: [] as { id: string; category_id: string }[], results: new Set<string>() }
      }
      const artifactLists = await Promise.all(
        categoryIds.map((cid) => apiClient.artifacts.getByCategory(cid))
      )
      const artifacts = artifactLists.flat() as { id: string; category_id: string }[]
      const artifactIds = artifacts.map((a) => a.id)
      if (artifactIds.length === 0) {
        return { artifacts, results: new Set<string>() }
      }
      const resultLists = await Promise.all(
        artifactIds.map((aid) => apiClient.artifactResults.getByArtifact(aid))
      )
      const results = new Set<string>()
      resultLists.forEach((rows, i) => {
        if (rows?.length) results.add(artifactIds[i]!)
      })
      return { artifacts, results }
    },
    enabled: categoryIds.length > 0,
  })

  if (!result) return {}

  const { artifacts, results } = result
  const map: CategoryProgressMap = {}
  for (const id of categoryIds) {
    const catArtifacts = artifacts.filter((a) => a.category_id === id)
    const done = catArtifacts.filter((a) => results.has(a.id)).length
    map[id] = { total: catArtifacts.length, done }
  }
  return map
}
