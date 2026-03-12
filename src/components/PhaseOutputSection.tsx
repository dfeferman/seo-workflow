import { useState, useCallback } from 'react'
import { usePhaseOutputTemplates } from '@/hooks/usePhaseOutputTemplates'
import { useCategoryPhaseOutput } from '@/hooks/useCategoryPhaseOutput'
import { useSaveCategoryPhaseOutput } from '@/hooks/useSaveCategoryPhaseOutput'
import { useDeleteCategoryPhaseOutput } from '@/hooks/useDeleteCategoryPhaseOutput'
import { usePhaseArtifactResultsMap } from '@/hooks/usePhaseArtifactResultsMap'
import { compilePhaseOutput } from '@/utils/compilePhaseOutput'
import { ConfirmModal } from '@/components/ConfirmModal'
import type { ArtifactPhase } from '@/types/database.types'

const PHASE_COLORS: Record<ArtifactPhase, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-[#f3e8ff]', text: 'text-[#7c3aed]', border: 'border-[#7c3aed]/20' },
  B: { bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]', border: 'border-[#2563eb]/20' },
  C: { bg: 'bg-[#fef3c7]', text: 'text-[#d97706]', border: 'border-[#d97706]/20' },
  D: { bg: 'bg-[#d1fae5]', text: 'text-[#059669]', border: 'border-[#059669]/20' },
  E: { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', border: 'border-[#dc2626]/20' },
  F: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#6b7280]/20' },
  G: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#6b7280]/20' },
  X: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#6b7280]/20' },
}

type Props = {
  categoryId: string
  phase: ArtifactPhase
  onCopyFlash?: (msg: string) => void
}

export function PhaseOutputSection({ categoryId, phase, onCopyFlash }: Props) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { data: templates = [] } = usePhaseOutputTemplates()
  const { data: phaseOutput, isLoading: outputLoading } = useCategoryPhaseOutput(categoryId, phase)
  const { data: resultsMap = new Map() } = usePhaseArtifactResultsMap(categoryId, phase)
  const saveOutput = useSaveCategoryPhaseOutput()
  const deleteOutput = useDeleteCategoryPhaseOutput()

  const template = templates.find((t) => t.phase === phase)
  const colors = PHASE_COLORS[phase]

  const handleGenerate = useCallback(async () => {
    if (!template) return
    const compiled = compilePhaseOutput(template.template_text, resultsMap)
    await saveOutput.mutateAsync({ categoryId, phase, outputText: compiled })
    onCopyFlash?.('Phase-Output generiert')
  }, [template, resultsMap, categoryId, phase, saveOutput, onCopyFlash])

  const handleCopy = useCallback(() => {
    if (phaseOutput?.output_text) {
      void navigator.clipboard.writeText(phaseOutput.output_text)
      onCopyFlash?.('Phase-Output kopiert')
    }
  }, [phaseOutput?.output_text, onCopyFlash])

  const handleDeleteOutput = useCallback(async () => {
    await deleteOutput.mutateAsync({ categoryId, phase })
    setDeleteConfirmOpen(false)
    onCopyFlash?.('Phase-Output gelöscht')
  }, [categoryId, phase, deleteOutput, onCopyFlash])

  if (!template) {
    return (
      <div className="mx-6 mb-4 px-5 py-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 flex items-center gap-3">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${colors.bg} ${colors.text}`}>
          {phase}
        </span>
        <span>
          Kein Output-Template für Phase {phase} definiert.{' '}
          <span className="text-slate-400">In den Metadaten → „Phase-Outputs" anlegen.</span>
        </span>
      </div>
    )
  }

  return (
    <div className={`mx-6 mb-5 rounded-xl border ${colors.border} bg-white shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${colors.border} ${colors.bg}`}>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold font-sans ${colors.bg} ${colors.text} ring-2 ${colors.border}`}>
            {phase}
          </span>
          <div>
            <span className={`text-sm font-bold ${colors.text}`}>Phase {phase} · Output</span>
            {phaseOutput && (
              <span className="ml-2 text-2xs font-mono font-medium text-slate-400">v{phaseOutput.version}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phaseOutput?.status === 'final' && (
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
              ✓ Final
            </span>
          )}
          {phaseOutput?.status === 'draft' && (
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
              Entwurf
            </span>
          )}
          {phaseOutput?.output_text && (
            <button
              type="button"
              onClick={handleCopy}
              className="py-1.5 px-3 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              📋 Kopieren
            </button>
          )}
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={!phaseOutput?.output_text}
            className="py-1.5 px-3 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200"
          >
            Output löschen
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={saveOutput.isPending}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
              saveOutput.isPending
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800 border-transparent'
            }`}
          >
            {saveOutput.isPending ? 'Generieren…' : phaseOutput ? '↻ Neu generieren' : '▶ Output generieren'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {outputLoading ? (
          <p className="text-sm text-slate-500">Laden…</p>
        ) : phaseOutput?.output_text ? (
          <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed max-h-[300px] overflow-y-auto">
            {phaseOutput.output_text}
          </pre>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Noch kein Output generiert. Artefakt-Ergebnisse eintragen und dann „Output generieren" klicken.
          </p>
        )}
        {(saveOutput.isError || deleteOutput.isError) && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            Fehler: {(saveOutput.error ?? deleteOutput.error)?.message}
          </p>
        )}
      </div>

      <ConfirmModal
        open={deleteConfirmOpen}
        title={`Phase ${phase} · Output löschen?`}
        message="Der kompilierte Output wird unwiderruflich gelöscht. Die einzelnen Artefakt-Ergebnisse bleiben erhalten; Sie können den Output danach neu generieren."
        confirmLabel="Löschen"
        variant="danger"
        onConfirm={handleDeleteOutput}
        onCancel={() => setDeleteConfirmOpen(false)}
        isLoading={deleteOutput.isPending}
      />
    </div>
  )
}
