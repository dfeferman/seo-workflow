import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { getDefaultArtifactsForCategory } from '@/utils/createDefaultArtifacts'
import type { ContentType } from '@/types/database.types'

export type CreateCategoryInput = {
  projectId: string
  type: ContentType
  name: string
  hub_name?: string | null
  subcategoryNames?: string[]
  zielgruppen: string[]
  shop_typ?: string | null
  usps?: string | null
  ton?: string | null
  no_gos?: string | null
}

/**
 * Erstellt eine Kategorie (oder Hub + Unterkategorien), legt Standard-Artefakte an,
 * invalidiert Queries und gibt die ID der angelegten Kategorie zurück (Hub oder Blog).
 * Redirect erfolgt im Aufrufer (Modal) mit navigate().
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async (input: CreateCategoryInput): Promise<{ categoryId: string; projectId: string }> => {
      const { projectId, type, name, hub_name, subcategoryNames, zielgruppen, shop_typ, usps, ton, no_gos } = input

      // Nächste display_order für Top-Level-Kategorien
      const { data: existing } = await supabase
        .from('categories')
        .select('display_order')
        .eq('project_id', projectId)
        .is('parent_id', null)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle()
      const nextOrder = (existing?.display_order ?? -1) + 1

      const { data: category, error: catError } = await supabase
        .from('categories')
        .insert({
          project_id: projectId,
          parent_id: null,
          name,
          type,
          hub_name: type === 'category' ? (hub_name || name) : null,
          zielgruppen: zielgruppen.length ? zielgruppen : null,
          shop_typ: type === 'category' ? shop_typ ?? null : null,
          usps: usps || null,
          ton: ton || null,
          no_gos: no_gos || null,
          display_order: nextOrder,
        })
        .select('id')
        .single()
      if (catError) throw catError
      if (!category) throw new Error('Kategorie konnte nicht erstellt werden.')

      const mainCategoryId = category.id

      // Optional: Unterkategorien (nur bei type category)
      if (type === 'category' && subcategoryNames?.length) {
        for (let i = 0; i < subcategoryNames.length; i++) {
          const subName = subcategoryNames[i].trim()
          if (!subName) continue
          await supabase.from('categories').insert({
            project_id: projectId,
            parent_id: mainCategoryId,
            name: subName,
            type: 'category',
            display_order: i,
          })
        }
      }

      // Standard-Artefakte anlegen (an der Hauptkategorie / Hub)
      const artifacts = getDefaultArtifactsForCategory(mainCategoryId, type)
      const { error: artError } = await supabase.from('artifacts').insert(artifacts)
      if (artError) throw artError

      return { categoryId: mainCategoryId, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['all-categories', projectId] })
      queryClient.invalidateQueries({ queryKey: ['categories', projectId] })
      queryClient.invalidateQueries({ queryKey: ['category-progress', projectId] })
    },
  })

  const createAndGo = async (input: CreateCategoryInput) => {
    const result = await mutation.mutateAsync(input)
    navigate({
      to: '/projects/$projectId/categories/$categoryId',
      params: { projectId: result.projectId, categoryId: result.categoryId },
    })
  }

  return { createCategory: mutation.mutateAsync, createAndGo, ...mutation }
}
