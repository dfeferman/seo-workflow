import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/database.types'

export type CategoryUpdatePayload = Partial<Pick<
  CategoryRow,
  'name' | 'hub_name' | 'zielgruppen' | 'shop_typ' | 'usps' | 'ton' | 'no_gos'
>>

export function useUpdateCategory(categoryId: string | undefined, projectId: string | undefined) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: CategoryUpdatePayload) => {
      if (!categoryId) throw new Error('Keine Kategorie ausgewählt.')
      const { error } = await supabase
        .from('categories')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category', categoryId] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['all-categories', projectId] })
        queryClient.invalidateQueries({ queryKey: ['categories', projectId] })
        queryClient.invalidateQueries({ queryKey: ['category-progress', projectId] })
      }
    },
  })

  return mutation
}
