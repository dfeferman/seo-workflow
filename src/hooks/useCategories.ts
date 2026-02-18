import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/database.types'

/**
 * Top-Level-Kategorien eines Projekts (parent_id IS NULL), nach display_order.
 */
export function useCategories(projectId: string | undefined) {
  return useQuery({
    queryKey: ['categories', projectId],
    queryFn: async (): Promise<CategoryRow[]> => {
      if (!projectId) return []
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .is('parent_id', null)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!projectId,
  })
}

/**
 * Alle Kategorien eines Projekts (Hubs + Unterkategorien), für Sidebar mit Baum.
 */
export function useAllCategories(projectId: string | undefined) {
  return useQuery({
    queryKey: ['all-categories', projectId],
    queryFn: async (): Promise<CategoryRow[]> => {
      if (!projectId) return []
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!projectId,
  })
}

/** Baum: Hubs mit children (Unterkategorien). */
export function buildCategoryTree(categories: CategoryRow[]) {
  const roots = categories.filter((c) => c.parent_id == null)
  const byParent = new Map<string | null, CategoryRow[]>()
  for (const c of categories) {
    const key = c.parent_id ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.display_order - b.display_order)
  }
  return roots.map((r) => ({
    ...r,
    children: (byParent.get(r.id) ?? []),
  }))
}
