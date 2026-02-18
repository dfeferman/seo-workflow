import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/database.types'

export function useCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async (): Promise<CategoryRow | null> => {
      if (!categoryId) return null
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!categoryId,
  })
}
