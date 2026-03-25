import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { CategoryReferenceDocRow } from '@/types/database.types'

export function useCategoryReferenceDocs(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['category_reference_docs', categoryId],
    queryFn: async (): Promise<CategoryReferenceDocRow[]> => {
      if (!categoryId) return []
      return apiClient.categoryReferenceDocs.getByCategory(categoryId)
    },
    enabled: !!categoryId,
  })
}

type UpsertInput = {
  id?: string
  category_id: string
  title: string
  content: string
}

export function useUpsertCategoryReferenceDoc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpsertInput) => {
      if (input.id) {
        return apiClient.categoryReferenceDocs.update(input.id, {
          title: input.title.trim(),
          content: input.content,
        })
      }
      return apiClient.categoryReferenceDocs.create({
        category_id: input.category_id,
        title: input.title.trim(),
        content: input.content,
      })
    },
    onSuccess: (doc) => {
      const cid = (doc as CategoryReferenceDocRow).category_id
      void queryClient.invalidateQueries({ queryKey: ['category_reference_docs', cid] })
    },
  })
}

export function useDeleteCategoryReferenceDoc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (doc: Pick<CategoryReferenceDocRow, 'id' | 'category_id'>) => {
      await apiClient.categoryReferenceDocs.delete(doc.id)
      return doc
    },
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({ queryKey: ['category_reference_docs', doc.category_id] })
    },
  })
}
