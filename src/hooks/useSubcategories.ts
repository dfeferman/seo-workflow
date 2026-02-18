import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/database.types'

/**
 * Unterkategorien (Kinder) einer Kategorie (parent_id = categoryId).
 */
export function useSubcategories(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async (): Promise<CategoryRow[]> => {
      if (!categoryId) return []
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', categoryId)
        .order('display_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!categoryId,
  })
}
