import { useState, useCallback, useEffect, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useArtifacts, useArtifactStatusMap } from '@/hooks/useArtifacts'
import { usePlaceholderData } from '@/hooks/usePlaceholderData'
import { useProject } from '@/hooks/useProject'
import { useCategory } from '@/hooks/useCategory'
import { PhasePills } from '@/components/PhasePills'
import { WorkflowTable } from '@/components/WorkflowTable'
import { ArtifactPanel } from '@/components/ArtifactPanel'
import { CreateArtifactWizard } from '@/components/CreateArtifactWizard'
import { TemplateBrowser } from '@/components/TemplateBrowser'
import { SaveTemplateModal } from '@/components/SaveTemplateModal'
import { ExportModal } from '@/components/ExportModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { WorkflowTableSkeleton } from '@/components/LoadingSkeleton'
import { useDeleteArtifact } from '@/hooks/useDeleteArtifact'
import type { TemplateRow } from '@/types/database.types'
import type { ArtifactRow } from '@/types/database.types'
import type { ArtifactPhase } from '@/types/database.types'
import { supabase } from '@/lib/supabase'
import { replacePlaceholders } from '@/utils/replacePlaceholders'

export const Route = createFileRoute('/projects/$projectId/categories/$categoryId/')({
  validateSearch: (search: Record<string, unknown>) => ({
    open: search.open === 'templates' ? ('templates' as const) : undefined,
  }),
  component: WorkflowPage,
})

function WorkflowPage() {
  const { projectId, categoryId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null)
  const [activePhase, setActivePhase] = useState<ArtifactPhase | null>(null)
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const [createArtifactOpen, setCreateArtifactOpen] = useState(false)
  const [templateBrowserOpen, setTemplateBrowserOpen] = useState(false)
  const [templateToApply, setTemplateToApply] = useState<TemplateRow | null>(null)
  const [saveTemplateModalArtifact, setSaveTemplateModalArtifact] = useState<ArtifactRow | null>(null)
  const [deleteArtifactConfirm, setDeleteArtifactConfirm] = useState<ArtifactRow | null>(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { data: project } = useProject(projectId)
  const deleteArtifact = useDeleteArtifact(categoryId)
  const { placeholderMap } = usePlaceholderData(categoryId)
  const { data: category } = useCategory(categoryId)
  const { data: parentCategory } = useCategory(category?.parent_id ?? undefined)
  const { data: artifacts = [], isLoading: artifactsLoading } = useArtifacts(categoryId)
  const artifactIds = artifacts.map((a) => a.id)
  const { data: statusMap = {} } = useArtifactStatusMap(categoryId, artifactIds)

  const selectedArtifact = selectedArtifactId
    ? artifacts.find((a) => a.id === selectedArtifactId) ?? null
    : null

  useEffect(() => {
    if (!flashMessage) return
    const t = setTimeout(() => setFlashMessage(null), 2000)
    return () => clearTimeout(t)
  }, [flashMessage])

  // Bei Navigation mit ?open=templates (z. B. von Übersicht/Einstellungen) Template-Browser öffnen
  useEffect(() => {
    if (search.open === 'templates') {
      setTemplateBrowserOpen(true)
      navigate({ to: '.', search: {}, replace: true })
    }
  }, [search.open, navigate])

  // Cmd+K / Strg+K: Template-Browser öffnen (Step 15: Keyboard-Shortcuts)
  const openTemplateBrowserRef = useRef(() => setTemplateBrowserOpen(true))
  openTemplateBrowserRef.current = () => setTemplateBrowserOpen(true)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openTemplateBrowserRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleCopyPrompt = useCallback(
    (artifact: ArtifactRow) => {
      const text = replacePlaceholders(artifact.prompt_template, category ?? null, placeholderMap)
      void navigator.clipboard.writeText(text).then(() => setFlashMessage('Kopiert!'))
    },
    [category, placeholderMap]
  )

  const handleCopyResult = useCallback(async (artifact: ArtifactRow) => {
    const { data } = await supabase
      .from('artifact_results')
      .select('result_text')
      .eq('artifact_id', artifact.id)
      .order('version', { ascending: false })
      .limit(1)
      .single()
    if (data?.result_text) {
      void navigator.clipboard.writeText(data.result_text).then(() => setFlashMessage('Kopiert!'))
    }
  }, [])

  const handleConfirmDeleteArtifact = useCallback(() => {
    if (!deleteArtifactConfirm) return
    const id = deleteArtifactConfirm.id
    deleteArtifact.mutate(id, {
      onSuccess: () => {
        setSelectedArtifactId((current) => (current === id ? null : current))
        setDeleteArtifactConfirm(null)
      },
    })
  }, [deleteArtifactConfirm, deleteArtifact])

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden min-w-0">
        {/* Topbar: Zeile 1 = Aktionen, Zeile 2 = Breadcrumb */}
      <div className="flex flex-col border-b border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-start gap-2 px-6 py-3">
          <Link
            to="/projects/$projectId/categories/$categoryId/overview"
            params={{ projectId, categoryId }}
            className="py-2 px-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            📊 Übersicht
          </Link>
          <button
            type="button"
            onClick={() => setTemplateBrowserOpen(true)}
            className="py-2 px-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Template-Bibliothek (⌘K / Strg+K)"
          >
            📚 Templates
          </button>
          <Link
            to="/projects/$projectId/categories/$categoryId/settings"
            params={{ projectId, categoryId }}
            className="py-2 px-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            ✎ Metadaten
          </Link>
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="py-2 px-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            ⬇ Export
          </button>
          <button
            type="button"
            onClick={() => { setTemplateToApply(null); setCreateArtifactOpen(true) }}
            className="py-2 px-4 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            ＋ Artefakt
          </button>
        </div>
        <nav className="flex items-center gap-2 px-6 pb-3 text-sm text-slate-500" aria-label="Breadcrumb">
          <span>{project?.name ?? 'Aktuelles Projekt'}</span>
          {parentCategory && (
            <>
              <span aria-hidden>›</span>
              <Link
                to="/projects/$projectId/categories/$categoryId"
                params={{ projectId, categoryId: parentCategory.id }}
                className="text-slate-600 hover:text-slate-900 hover:underline"
              >
                {parentCategory.name}
              </Link>
            </>
          )}
          <span aria-hidden>›</span>
          <span className="text-slate-900 font-semibold">
            {category?.name ?? '…'}
          </span>
        </nav>
      </div>

      {/* Phase Pills + Tabelle */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <PhasePills
            artifacts={artifacts}
            statusMap={statusMap}
            activePhase={activePhase}
            onPhaseClick={setActivePhase}
          />

          {/* Table */}
          {artifactsLoading ? (
            <WorkflowTableSkeleton rows={8} />
          ) : (
            <WorkflowTable
              artifacts={artifacts}
              statusMap={statusMap}
              selectedArtifactId={selectedArtifactId}
              onSelectArtifact={(a) => setSelectedArtifactId((id) => (id === a.id ? null : a.id))}
              onCopyPrompt={handleCopyPrompt}
              onCopyResult={handleCopyResult}
              onDeleteArtifact={(a) => setDeleteArtifactConfirm(a)}
            />
          )}

          {flashMessage && (
            <div
              className="fixed bottom-7 right-7 bg-white border border-slate-100 py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 shadow-md z-50 animate-[slideUp_0.2s_ease-out]"
              role="status"
              aria-live="polite"
            >
              {flashMessage}
            </div>
          )}
      </div>
      </main>

      {selectedArtifact && (
        <ArtifactPanel
          artifact={selectedArtifact}
          category={category ?? null}
          status={statusMap[selectedArtifact.id] ?? 'open'}
          onClose={() => setSelectedArtifactId(null)}
          onCopyFlash={setFlashMessage}
          onSaveAsTemplate={(a) => setSaveTemplateModalArtifact(a)}
          onDeleteArtifact={(a) => setDeleteArtifactConfirm(a)}
        />
      )}

      {templateBrowserOpen && (
        <TemplateBrowser
          open={true}
          onClose={() => setTemplateBrowserOpen(false)}
          onUseTemplate={(t) => {
            setTemplateToApply(t)
            setTemplateBrowserOpen(false)
            setCreateArtifactOpen(true)
          }}
        />
      )}

      {createArtifactOpen && (
        <CreateArtifactWizard
          open={true}
          onClose={() => { setCreateArtifactOpen(false); setTemplateToApply(null) }}
          categoryId={categoryId}
          projectId={projectId}
          category={category ?? null}
          initialFromTemplate={templateToApply}
        />
      )}

      {saveTemplateModalArtifact && (
        <SaveTemplateModal
          open={true}
          artifact={saveTemplateModalArtifact}
          onClose={() => setSaveTemplateModalArtifact(null)}
        />
      )}

      {exportModalOpen && (
        <ExportModal
          open={true}
          onClose={() => setExportModalOpen(false)}
          categoryId={categoryId}
          onCopyFlash={setFlashMessage}
        />
      )}

      {deleteArtifactConfirm && (
        <ConfirmModal
          open={true}
          title="Artefakt löschen?"
          message={`„${deleteArtifactConfirm.name}" und alle zugehörigen Ergebnisse unwiderruflich löschen?`}
          confirmLabel="Löschen"
          variant="danger"
          onConfirm={handleConfirmDeleteArtifact}
          onCancel={() => setDeleteArtifactConfirm(null)}
          isLoading={deleteArtifact.isPending}
        />
      )}
    </div>
  )
}
