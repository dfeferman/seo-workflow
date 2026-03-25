import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { apiClient } from '@/lib/apiClient'
import { buildArtifactsFromTemplates } from '@/utils/createDefaultArtifacts'
import type { ContentType, TemplateRow } from '@/types/database.types'

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

      const rawTemplates = await apiClient.templates.getAll()
      const templates: TemplateRow[] = [...rawTemplates].sort((a, b) => {
        const pa = String(a.phase ?? '')
        const pb = String(b.phase ?? '')
        if (pa !== pb) return pa.localeCompare(pb)
        return String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))
      })

      const existingAll = await apiClient.categories.getByProject(projectId)
      const roots = existingAll.filter((c) => c.parent_id == null)
      const maxOrder = roots.reduce((m, c) => Math.max(m, c.display_order ?? 0), -1)
      const nextOrder = maxOrder + 1

      const category = await apiClient.categories.create({
        project_id: projectId,
        parent_id: null,
        name,
        type,
        hub_name: type === 'category' ? hub_name || name : null,
        zielgruppen: zielgruppen.length ? zielgruppen : null,
        shop_typ: type === 'category' ? shop_typ ?? null : null,
        usps: usps || null,
        ton: ton || null,
        no_gos: no_gos || null,
        display_order: nextOrder,
      })
      const mainCategoryId = category.id as string

      if (type === 'category' && subcategoryNames?.length) {
        for (let i = 0; i < subcategoryNames.length; i++) {
          const subName = subcategoryNames[i].trim()
          if (!subName) continue
          const subCat = await apiClient.categories.create({
            project_id: projectId,
            parent_id: mainCategoryId,
            name: subName,
            type: 'category',
            display_order: i,
          })
          if (subCat?.id) {
            const subArtifacts = buildArtifactsFromTemplates(templates, subCat.id as string)
            for (const row of subArtifacts) {
              await apiClient.artifacts.create(row)
            }
          }
        }
      }

      const artifacts = buildArtifactsFromTemplates(templates, mainCategoryId)
      for (const row of artifacts) {
        await apiClient.artifacts.create(row)
      }

      return { categoryId: mainCategoryId, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['all-categories', projectId] })
      queryClient.invalidateQueries({ queryKey: ['categories', projectId] })
      queryClient.invalidateQueries({ queryKey: ['category-progress', projectId] })
      queryClient.invalidateQueries({ queryKey: ['subcategories'] })
    },
  })

  const createAndGo = async (input: CreateCategoryInput) => {
    const result = await mutation.mutateAsync(input)
    navigate({
      to: '/projects/$projectId/categories/$categoryId',
      params: { projectId: result.projectId, categoryId: result.categoryId },
      search: { open: undefined },
    })
  }

  return { createCategory: mutation.mutateAsync, createAndGo, ...mutation }
}
