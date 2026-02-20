import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useSubcategories } from '@/hooks/useSubcategories'
import { useCategoryProgress } from '@/hooks/useCategoryProgress'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { CategoryRow } from '@/types/database.types'

type Props = {
  projectId: string
  categoryId: string
  onAddSubcategory?: () => void
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function SubcategoryList({ projectId, categoryId, onAddSubcategory }: Props) {
  const queryClient = useQueryClient()
  const { data: subcategories = [], isLoading } = useSubcategories(categoryId)
  const subcategoryIds = subcategories.map((c) => c.id)
  const progress = useCategoryProgress(projectId, subcategoryIds)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CategoryRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setAddError(null)
    setIsAdding(true)
    try {
      const nextOrder = subcategories.length
      const { error } = await supabase.from('categories').insert({
        project_id: projectId,
        parent_id: categoryId,
        name,
        type: 'category',
        display_order: nextOrder,
      })
      if (error) {
        setAddError(error.message)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['subcategories', categoryId] })
      queryClient.invalidateQueries({ queryKey: ['all-categories', projectId] })
      queryClient.invalidateQueries({ queryKey: ['category-progress', projectId] })
      setNewName('')
      setAddModalOpen(false)
      onAddSubcategory?.()
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (sub: CategoryRow) => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('categories').delete().eq('id', sub.id)
      if (error) {
        setDeleteError(error.message)
        return
      }
      queryClient.invalidateQueries({ queryKey: ['subcategories', categoryId] })
      queryClient.invalidateQueries({ queryKey: ['all-categories', projectId] })
      queryClient.invalidateQueries({ queryKey: ['category-progress', projectId] })
      setDeleteConfirm(null)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        Unterkategorien laden…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text flex items-center gap-2">
          <span className="text-lg">📂</span>
          Unterkategorien (Spokes)
        </h3>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="text-sm font-medium text-accent hover:underline"
        >
          + Neue Unterkategorie
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {subcategories.length === 0 ? (
          <p className="text-sm text-muted py-4">Noch keine Unterkategorien. Leg eine neue an.</p>
        ) : (
          subcategories.map((sub) => {
            const { done = 0, total = 0 } = progress[sub.id] ?? {}
            return (
              <div
                key={sub.id}
                className="flex items-center gap-3 px-4 py-3.5 bg-surface2 border border-border rounded-lg hover:border-[#d0d4d8] hover:bg-surface transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text text-sm">{sub.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    <span>📊 {done}/{total} Artefakte</span>
                    <span>⏱ Erstellt: {formatDate(sub.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Link
                    to="/projects/$projectId/categories/$categoryId"
                    params={{ projectId, categoryId: sub.id }}
                    className="w-8 h-8 rounded-md border border-border bg-surface text-muted flex items-center justify-center text-sm hover:bg-surface-2 hover:text-text"
                    title="Zum Workflow"
                  >
                    →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(sub)}
                    className="w-8 h-8 rounded-md border border-border bg-surface text-muted flex items-center justify-center text-sm hover:bg-red-50 hover:text-red hover:border-red"
                    title="Löschen"
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal: Neue Unterkategorie */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Neue Unterkategorie"
        >
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-text mb-1">Neue Unterkategorie</h3>
            <p className="text-sm text-muted mb-4">Name der Spoke-Kategorie</p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="z.B. Händedesinfektion"
              className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            {addError && (
              <p className="text-sm text-red mb-4" role="alert">
                {addError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { if (!isAdding) { setAddModalOpen(false); setAddError(null) } }}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-surface-2"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim() || isAdding}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50"
              >
                {isAdding ? 'Wird angelegt…' : 'Anlegen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Unterkategorie löschen"
        >
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-text mb-2">Unterkategorie löschen?</h3>
            <p className="text-sm text-muted mb-4">
              „{deleteConfirm.name}" und alle zugehörigen Daten werden gelöscht. Dies kann nicht rückgängig gemacht werden.
            </p>
            {deleteError && (
              <p className="text-sm text-red mb-4" role="alert">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { if (!isDeleting) { setDeleteConfirm(null); setDeleteError(null) } }}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-surface-2"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red text-white text-sm font-semibold disabled:opacity-50"
              >
                {isDeleting ? 'Wird gelöscht…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
