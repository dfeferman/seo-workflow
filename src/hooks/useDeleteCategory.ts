import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/database.types'

/** Entfernt eine Kategorie und alle Unterkategorien rekursiv aus einer flachen Liste. */
function filterOutCategoryAndChildren(categories: CategoryRow[], deleteId: string): CategoryRow[] {
  const idsToDelete = new Set<string>([deleteId])
  let added: number
  do {
    added = 0
    for (const c of categories) {
      if (c.parent_id && idsToDelete.has(c.parent_id) && !idsToDelete.has(c.id)) {
        idsToDelete.add(c.id)
        added++
      }
    }
  } while (added > 0)
  return categories.filter((c) => !idsToDelete.has(c.id))
}

/**
 * Löscht eine Kategorie. Durch DB CASCADE werden automatisch gelöscht:
 * - Unterkategorien (parent_id = diese Kategorie)
 * - Alle Artefakte der Kategorie und ihrer Unterkategorien
 * - artifact_results und artifact_dependencies der betroffenen Artefakte
 * Optimistic Update: Cache wird sofort angepasst, bei Fehler zurückgerollt.
 */
export function useDeleteCategory(projectId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (error) throw error
    },
    onMutate: async (categoryId: string) => {
      if (!projectId) return
      const queryKeyAll: [string, string] = ['all-categories', projectId]
      const queryKeyTop: [string, string] = ['categories', projectId]
      await queryClient.cancelQueries({ queryKey: queryKeyAll })
      await queryClient.cancelQueries({ queryKey: queryKeyTop })
      const prevAll = queryClient.getQueryData<CategoryRow[]>(queryKeyAll)
      const prevTop = queryClient.getQueryData<CategoryRow[]>(queryKeyTop)
      const nextAll = prevAll ? filterOutCategoryAndChildren(prevAll, categoryId) : undefined
      const nextTop = prevTop ? prevTop.filter((c) => c.id !== categoryId) : undefined
      if (nextAll !== undefined) queryClient.setQueryData(queryKeyAll, nextAll)
      if (nextTop !== undefined) queryClient.setQueryData(queryKeyTop, nextTop)
      return { prevAll, prevTop }
    },
    onError: (_err, _categoryId, context) => {
      if (!projectId || !context) return
      if (context.prevAll) queryClient.setQueryData(['all-categories', projectId], context.prevAll)
      if (context.prevTop) queryClient.setQueryData(['categories', projectId], context.prevTop)
    },
    onSettled: (_, __, categoryId) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['all-categories', projectId] })
        queryClient.invalidateQueries({ queryKey: ['categories', projectId] })
      }
      queryClient.removeQueries({ queryKey: ['artifacts', categoryId] })
      queryClient.invalidateQueries({ queryKey: ['artifact-status-map'] })
    },
  })
}
