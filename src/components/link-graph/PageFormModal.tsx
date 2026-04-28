import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiClient } from '@/lib/apiClient'
import { useAllCategories } from '@/hooks/useCategories'
import type { PageRow, PageStatus, PageType } from '@/types/database.types'

const TYPES: PageType[] = ['hub', 'spoke', 'blog']
const STATUSES: PageStatus[] = ['published', 'draft', 'planned']

type Mode = 'create' | 'edit'

type Props = {
  open: boolean
  mode: Mode
  projectId: string
  initialPage?: PageRow | null
  onClose: () => void
}

export function PageFormModal({ open, mode, projectId, initialPage, onClose }: Props) {
  const qc = useQueryClient()
  const { data: categories = [] } = useAllCategories(projectId)

  const [name, setName] = useState('')
  const [type, setType] = useState<PageType>('spoke')
  const [urlSlug, setUrlSlug] = useState('')
  const [status, setStatus] = useState<PageStatus>('draft')
  const [categoryId, setCategoryId] = useState<string>('')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initialPage) {
      setName(initialPage.name)
      setType(initialPage.type)
      setUrlSlug(initialPage.url_slug ?? '')
      setStatus(initialPage.status)
      setCategoryId(initialPage.category_id ?? '')
    } else if (mode === 'create') {
      setName('')
      setType('spoke')
      setUrlSlug('')
      setStatus('draft')
      setCategoryId('')
    }
  }, [open, mode, initialPage])

  const mutation = useMutation({
    mutationFn: async () => {
      const slug = urlSlug.trim()
      if (!slug) throw new Error('URL-Slug ist erforderlich')
      const cat = categoryId === '' ? null : categoryId
      if (mode === 'create') {
        return apiClient.pages.create({
          project_id: projectId,
          name: name.trim(),
          type,
          url_slug: slug,
          status,
          category_id: cat,
        })
      }
      if (!initialPage) throw new Error('Keine Seite')
      return apiClient.pages.update(initialPage.id, {
        name: name.trim(),
        type,
        url_slug: slug,
        status,
        category_id: cat,
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['pages', projectId] })
      await qc.invalidateQueries({ queryKey: ['page-links', projectId] })
      onClose()
    },
  })

  if (!open) return null

  const title = mode === 'create' ? 'Seite anlegen' : 'Seite bearbeiten'
  const errMsg = mutation.error instanceof Error ? mutation.error.message : null

  const content = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && !mutation.isPending && onClose()}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-base font-bold text-slate-900 mb-4">{title}</h2>

        {errMsg && (
          <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errMsg}</p>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              required
            />
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Typ</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PageType)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">URL-Slug</span>
            <input
              value={urlSlug}
              onChange={(e) => setUrlSlug(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono text-xs"
              required
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PageStatus)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Kategorie (optional)</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">— keine —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim() || !urlSlug.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {mutation.isPending ? 'Speichern …' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
