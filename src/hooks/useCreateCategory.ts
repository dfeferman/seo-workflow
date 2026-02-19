import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { buildArtifactsFromTemplates } from '@/utils/createDefaultArtifacts'
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
 * Erstellt eine Kategorie (oder Hub + Unterkategorien), legt Artefakte aus der Template-Bibliothek an
 * (nur die in den Phasen A–X vorhandenen Templates), invalidiert Queries und gibt die ID zurück.
 * Redirect erfolgt im Aufrufer (Modal) mit navigate().
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async (input: CreateCategoryInput): Promise<{ categoryId: string; projectId: string }> => {
      const { projectId, type, name, hub_name, subcategoryNames, zielgruppen, shop_typ, usps, ton, no_gos } = input

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet.')
      const { data: templates = [], error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('phase', { ascending: true })
        .order('created_at', { ascending: true })
      if (templatesError) throw templatesError

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

      // Optional: Unterkategorien (nur bei type category) – jede mit Fehlerprüfung und Standard-Artefakten
      if (type === 'category' && subcategoryNames?.length) {
        for (let i = 0; i < subcategoryNames.length; i++) {
          const subName = subcategoryNames[i].trim()
          if (!subName) continue
          const { data: subCat, error: subError } = await supabase
            .from('categories')
            .insert({
              project_id: projectId,
              parent_id: mainCategoryId,
              name: subName,
              type: 'category',
              display_order: i,
            })
            .select('id')
            .single()
          if (subError) throw subError
          if (subCat?.id) {
            const subArtifacts = buildArtifactsFromTemplates(templates, subCat.id)
            if (subArtifacts.length) {
              const { error: subArtError } = await supabase.from('artifacts').insert(subArtifacts)
              if (subArtError) throw subArtError
            }
          }
        }
      }

      // Artefakte aus Template-Bibliothek anlegen (an der Hauptkategorie / Hub)
      const artifacts = buildArtifactsFromTemplates(templates, mainCategoryId)
      if (artifacts.length) {
        const { error: artError } = await supabase.from('artifacts').insert(artifacts)
        if (artError) throw artError
      }

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
