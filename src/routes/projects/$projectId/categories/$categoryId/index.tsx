import { useState, useCallback, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
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
import { useDeleteArtifact } from '@/hooks/useDeleteArtifact'
import type { TemplateRow } from '@/types/database.types'
import type { ArtifactRow } from '@/types/database.types'
import type { ArtifactPhase } from '@/types/database.types'
import { supabase } from '@/lib/supabase'
import { replacePlaceholders } from '@/utils/replacePlaceholders'

export const Route = createFileRoute('/projects/$projectId/categories/$categoryId/')({
  component: WorkflowPage,
})

function WorkflowPage() {
  const { projectId, categoryId } = Route.useParams()
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
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-surface2 min-w-0">
        {/* Topbar */}
      <div className="flex items-center justify-between h-16 px-7 border-b border-border bg-surface flex-shrink-0">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <span className="text-muted">{project?.name ?? '…'}</span>
          <span className="text-[#a0aec0]" aria-hidden>›</span>
          <span className="text-text font-semibold">
            {category?.name ?? '…'}
          </span>
        </nav>
        <div className="flex gap-2.5 items-center">
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            ⬇ Export
          </button>
          <Link
            to="/projects/$projectId/categories/$categoryId/settings"
            params={{ projectId, categoryId }}
            className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            ✎ Metadaten
          </Link>
          <Link
            to="/projects/$projectId/categories/$categoryId/overview"
            params={{ projectId, categoryId }}
            className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            📊 Übersicht
          </Link>
          <button
            type="button"
            onClick={() => setTemplateBrowserOpen(true)}
            className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            📚 Aus Vorlage
          </button>
          <button
            type="button"
            onClick={() => { setTemplateToApply(null); setCreateArtifactOpen(true) }}
            className="py-2 px-3.5 rounded-lg text-sm font-semibold border border-accent bg-accent text-white hover:bg-[#4a6fef]"
          >
            ＋ Artefakt
          </button>
        </div>
      </div>

      {/* Progress + Phase Pills */}
      <PhasePills
        artifacts={artifacts}
        statusMap={statusMap}
        activePhase={activePhase}
        onPhaseClick={setActivePhase}
      />

      {/* Table */}
      {artifactsLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted text-sm">
          Artefakte laden…
        </div>
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
            className="fixed bottom-7 right-7 bg-surface border-2 border-green text-green py-3 px-4 rounded-lg text-sm font-medium shadow-lg z-50"
            role="status"
            aria-live="polite"
          >
            {flashMessage}
          </div>
        )}
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
