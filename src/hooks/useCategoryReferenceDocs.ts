import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CategoryReferenceDocRow } from '@/types/database.types'

export function useCategoryReferenceDocs(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['category_reference_docs', categoryId],
    queryFn: async (): Promise<CategoryReferenceDocRow[]> => {
      if (!categoryId) return []
      const { data, error } = await supabase
        .from('category_reference_docs')
        .select('*')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
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
        const { data, error } = await supabase
          .from('category_reference_docs')
          .update({
            title: input.title.trim(),
            content: input.content,
          })
          .eq('id', input.id)
          .select('*')
          .single()
        if (error) throw error
        return data
      }
      const { data, error } = await supabase
        .from('category_reference_docs')
        .insert({
          category_id: input.category_id,
          title: input.title.trim(),
          content: input.content,
        })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({ queryKey: ['category_reference_docs', doc.category_id] })
    },
  })
}

export function useDeleteCategoryReferenceDoc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (doc: Pick<CategoryReferenceDocRow, 'id' | 'category_id'>) => {
      const { error } = await supabase
        .from('category_reference_docs')
        .delete()
        .eq('id', doc.id)
      if (error) throw error
      return doc
    },
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({ queryKey: ['category_reference_docs', doc.category_id] })
    },
  })
}

