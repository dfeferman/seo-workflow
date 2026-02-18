import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTemplates } from '@/hooks/useTemplates'
import { useDeleteTemplate } from '@/hooks/useDeleteTemplate'
import { TemplateCard } from '@/components/TemplateCard'
import { TemplateFormModal } from '@/components/TemplateFormModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { TemplateGridSkeleton } from '@/components/LoadingSkeleton'
import { EmptyState } from '@/components/EmptyState'
import type { TemplateRow } from '@/types/database.types'

const PHASES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X'] as const

type Props = {
  open: boolean
  onClose: () => void
  onUseTemplate: (template: TemplateRow) => void
}

export function TemplateBrowser({ open, onClose, onUseTemplate }: Props) {
  const [search, setSearch] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [templateToEdit, setTemplateToEdit] = useState<TemplateRow | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<TemplateRow | null>(null)

  const { data: templates = [], isLoading } = useTemplates()
  const deleteTemplate = useDeleteTemplate()

  const filtered = useMemo(() => {
    let list = templates
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q)) ||
          (t.tags?.some((tag) => tag.toLowerCase().includes(q))) ||
          t.prompt_template.toLowerCase().includes(q)
      )
    }
    if (phaseFilter) {
      list = list.filter((t) => (t.phase?.toUpperCase() ?? '') === phaseFilter)
    }
    return list
  }, [templates, search, phaseFilter])

  const phaseCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of templates) {
      const p = (t.phase?.toUpperCase() ?? '') || '?'
      m[p] = (m[p] ?? 0) + 1
    }
    return m
  }, [templates])

  if (!open) return null

  const body = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Template-Bibliothek"
    >
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col min-w-0">
        <div className="p-5 border-b border-border bg-surface2 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-xl text-white shadow-sm">
                📚
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Template-Bibliothek</h2>
                <p className="text-sm text-muted">Vorlagen auswählen und ins Artefakt übernehmen</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg border border-border bg-surface text-muted hover:bg-surface-2 hover:text-text flex items-center justify-center"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={() => { setTemplateToEdit(null); setFormModalOpen(true) }}
              className="py-2.5 px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-[#4a6fef] flex items-center gap-2"
            >
              ＋ Neues Template
            </button>
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Templates durchsuchen…"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <aside className="w-52 border-r border-border bg-surface2 p-4 flex-shrink-0 overflow-y-auto">
            <div className="mb-4">
              <div className="text-2xs font-semibold text-muted uppercase tracking-wide mb-2">
                Phase
              </div>
              <button
                type="button"
                onClick={() => setPhaseFilter(null)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                  phaseFilter === null ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:bg-surface'
                }`}
              >
                Alle
              </button>
              {PHASES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhaseFilter(p)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors flex justify-between items-center ${
                    phaseFilter === p ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:bg-surface'
                  }`}
                >
                  <span>Phase {p}</span>
                  <span className="text-2xs font-mono text-muted">{(phaseCounts[p] ?? 0)}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-w-0 p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <span className="text-sm text-muted">
                <strong className="text-text">{filtered.length}</strong> Template
                {filtered.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-1 p-1 bg-surface2 rounded-lg">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    view === 'grid' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    view === 'list' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                  }`}
                >
                  Liste
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <TemplateGridSkeleton count={6} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={templates.length === 0 ? '📚' : '🔍'}
                  title={templates.length === 0 ? 'Keine Templates' : 'Keine Treffer'}
                  description={
                    templates.length === 0
                      ? 'Lege ein neues Template an (Button oben) oder speichere ein Artefakt als Template.'
                      : 'Keine Templates passen zur Suche oder zum Filter.'
                  }
                />
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      view="grid"
                      onUse={(tmpl) => {
                        onUseTemplate(tmpl)
                        onClose()
                      }}
                      onEdit={(tmpl) => { setTemplateToEdit(tmpl); setFormModalOpen(true) }}
                      onDelete={(tmpl) => setTemplateToDelete(tmpl)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      view="list"
                      onUse={(tmpl) => {
                        onUseTemplate(tmpl)
                        onClose()
                      }}
                      onEdit={(tmpl) => { setTemplateToEdit(tmpl); setFormModalOpen(true) }}
                      onDelete={(tmpl) => setTemplateToDelete(tmpl)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {createPortal(body, document.body)}
      {formModalOpen && (
        <TemplateFormModal
          open={true}
          onClose={() => { setFormModalOpen(false); setTemplateToEdit(null) }}
          template={templateToEdit}
          onSaved={() => {}}
        />
      )}
      {templateToDelete && (
        <ConfirmModal
          open={true}
          title="Template löschen?"
          message={`Vorlage „${templateToDelete.name}" unwiderruflich löschen?`}
          confirmLabel="Löschen"
          variant="danger"
          onConfirm={() => {
            deleteTemplate.mutate(templateToDelete.id, {
              onSuccess: () => setTemplateToDelete(null),
            })
          }}
          onCancel={() => setTemplateToDelete(null)}
          isLoading={deleteTemplate.isPending}
        />
      )}
    </>
  )
}
