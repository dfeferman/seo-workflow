import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { CategoryRow } from '@/types/database.types'

export type CategoryUpdatePayload = Partial<
  Pick<
    CategoryRow,
    'name' | 'hub_name' | 'zielgruppen' | 'shop_typ' | 'usps' | 'ton' | 'no_gos' | 'custom_placeholders'
  >
>

export function useUpdateCategory(categoryId: string | undefined, projectId: string | undefined) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: CategoryUpdatePayload): Promise<CategoryRow | void> => {
      if (!categoryId) throw new Error('Keine Kategorie ausgewählt.')
      return apiClient.categories.update(categoryId, payload) as Promise<CategoryRow>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category', categoryId] })
      queryClient.invalidateQueries({ queryKey: ['placeholder-data'] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['all-categories', projectId] })
        queryClient.invalidateQueries({ queryKey: ['categories', projectId] })
        queryClient.invalidateQueries({ queryKey: ['category-progress', projectId] })
        queryClient.invalidateQueries({ queryKey: ['subcategories'] })
      }
    },
  })

  return mutation
}
