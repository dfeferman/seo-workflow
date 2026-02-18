import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
      if (categoryIds.length === 0) return { artifacts: [] as { id: string; category_id: string }[], results: new Set<string>() }
      const { data: artifacts, error: e1 } = await supabase
        .from('artifacts')
        .select('id, category_id')
        .in('category_id', categoryIds)
      if (e1) throw e1
      const artifactIds = (artifacts ?? []).map((a) => a.id)
      if (artifactIds.length === 0) return { artifacts: artifacts ?? [], results: new Set<string>() }
      const { data: results, error: e2 } = await supabase
        .from('artifact_results')
        .select('artifact_id')
        .in('artifact_id', artifactIds)
      if (e2) throw e2
      return { artifacts: artifacts ?? [], results: new Set<string>((results ?? []).map((r) => r.artifact_id)) }
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
