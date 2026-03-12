import { useState, useCallback } from 'react'
import { replacePlaceholders } from '@/utils/replacePlaceholders'
import { useArtifactResults } from '@/hooks/useArtifactResults'
import { usePlaceholderData } from '@/hooks/usePlaceholderData'
import { useUpdateArtifact } from '@/hooks/useUpdateArtifact'
import { PhaseInputReference } from '@/components/PhaseInputReference'
import { ConfirmModal } from '@/components/ConfirmModal'
import type { ArtifactRow } from '@/types/database.types'
import type { CategoryRow } from '@/types/database.types'
import type { ArtifactStatus } from '@/hooks/useArtifacts'

const PHASE_LABELS: Record<string, string> = {
  A: 'Phase A',
  B: 'Phase B',
  C: 'Phase C',
  D: 'Phase D',
  E: 'Phase E',
  F: 'Phase F',
  G: 'Phase G',
  X: 'Phase X',
}

const STATUS_LABELS: Record<ArtifactStatus, string> = {
  done: '✅ Abgeschlossen',
  active: '⏳ In Arbeit',
  open: '⬜ Offen',
}

type ArtifactPanelProps = {
  artifact: ArtifactRow
  category: CategoryRow | null
  status: ArtifactStatus
  onClose: () => void
  onCopyFlash?: (message: string) => void
  onSaveAsTemplate?: (artifact: ArtifactRow) => void
  onDeleteArtifact?: (artifact: ArtifactRow) => void
}

export function ArtifactPanel({
  artifact,
  category,
  status,
  onClose,
  onCopyFlash,
  onSaveAsTemplate,
  onDeleteArtifact,
}: ArtifactPanelProps) {
  const [note, setNote] = useState('')
  const [draftText, setDraftText] = useState('')
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [promptEditing, setPromptEditing] = useState(false)
  const [promptDraft, setPromptDraft] = useState('')
  const [resetPromptConfirmOpen, setResetPromptConfirmOpen] = useState(false)

  const updateArtifact = useUpdateArtifact()

  const {
    latestResult,
    isLoading,
    saveResult,
    setResultFinal,
  } = useArtifactResults(artifact.id)
  const { placeholderMap } = usePlaceholderData(artifact.category_id)

  const promptTemplateForDisplay = promptEditing ? promptDraft : artifact.prompt_template
  const promptResolved = replacePlaceholders(promptTemplateForDisplay, category, placeholderMap)
  const displayResultText = draftText !== '' ? draftText : (latestResult?.result_text ?? '')
  const hasUnsavedEdit = draftText !== '' && draftText !== (latestResult?.result_text ?? '')
  const hasPromptEdit = promptEditing && promptDraft !== artifact.prompt_template

  const handleCopyPrompt = useCallback(() => {
    void navigator.clipboard.writeText(promptResolved)
    onCopyFlash?.('Prompt kopiert')
  }, [promptResolved, onCopyFlash])

  const handleCopyResult = useCallback(() => {
    if (displayResultText) {
      void navigator.clipboard.writeText(displayResultText)
      onCopyFlash?.('Ergebnis kopiert')
    }
  }, [displayResultText, onCopyFlash])

  const handleSaveResult = useCallback(async () => {
    const text = (draftText !== '' ? draftText : latestResult?.result_text ?? '').trim()
    if (!text) return
    setSaving(true)
    try {
      await saveResult({
        artifact_id: artifact.id,
        result_text: text,
        source: 'manual',
      })
      setDraftText('')
      onCopyFlash?.('Ergebnis gespeichert')
    } finally {
      setSaving(false)
    }
  }, [artifact.id, draftText, latestResult?.result_text, saveResult, onCopyFlash])

  const handleAbschliessen = useCallback(async () => {
    if (!latestResult) {
      const text = draftText.trim()
      if (text) {
        setFinishing(true)
        try {
          const saved = await saveResult({
            artifact_id: artifact.id,
            result_text: text,
            source: 'manual',
          })
          if (saved?.id) await setResultFinal(saved.id, artifact.id)
          onCopyFlash?.('Als abgeschlossen markiert')
        } finally {
          setFinishing(false)
        }
      }
      return
    }
    setFinishing(true)
    try {
      await setResultFinal(latestResult.id, artifact.id)
      onCopyFlash?.('Als abgeschlossen markiert')
    } finally {
      setFinishing(false)
    }
  }, [artifact.id, latestResult, draftText, saveResult, setResultFinal, onCopyFlash])

  const handleCopyAll = useCallback(() => {
    const all = `Prompt:\n${promptResolved}\n\nErgebnis:\n${displayResultText || '(leer)'}`
    void navigator.clipboard.writeText(all)
    onCopyFlash?.('Komplettes Artefakt kopiert')
  }, [promptResolved, displayResultText, onCopyFlash])

  const startPromptEdit = useCallback(() => {
    setPromptDraft(artifact.prompt_template)
    setPromptEditing(true)
  }, [artifact.prompt_template])

  const cancelPromptEdit = useCallback(() => {
    setPromptEditing(false)
    setPromptDraft('')
  }, [])

  const savePromptEdit = useCallback(async () => {
    await updateArtifact.mutateAsync({
      id: artifact.id,
      categoryId: artifact.category_id,
      prompt_template: promptDraft.trim() || ' ',
    })
    setPromptEditing(false)
    setPromptDraft('')
    onCopyFlash?.('Prompt gespeichert')
  }, [artifact.id, artifact.category_id, promptDraft, updateArtifact, onCopyFlash])

  const handleResetPrompt = useCallback(async () => {
    await updateArtifact.mutateAsync({
      id: artifact.id,
      categoryId: artifact.category_id,
      prompt_template: ' ',
    })
    setResetPromptConfirmOpen(false)
    setPromptEditing(false)
    setPromptDraft('')
    onCopyFlash?.('Prompt zurückgesetzt')
  }, [artifact.id, artifact.category_id, updateArtifact, onCopyFlash])

  return (
    <div className="w-[440px] min-w-[440px] flex flex-col bg-white border-l border-slate-100 overflow-hidden transition-all duration-250">
      {/* Header */}
      <div className="p-5 pt-5 pb-4 border-b border-slate-100 bg-slate-50 flex-shrink-0 flex justify-between items-start">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 leading-tight">
            {artifact.artifact_code} · {artifact.name}
          </h2>
          <div className="flex gap-2 mt-1.5">
            <span className="text-xs px-2 py-1 rounded bg-white border border-slate-200 text-slate-500 font-medium">
              {PHASE_LABELS[artifact.phase] ?? artifact.phase}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-white border border-slate-200 text-slate-500 font-medium">
              {STATUS_LABELS[status]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center text-base transition-colors"
          aria-label="Panel schließen"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 pt-5 space-y-6">
        {/* Prompt */}
        <section>
          <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                Prompt-Template
              </span>
              {artifact.template_id && (
                <span className="text-2xs text-slate-400">
                  Verknüpft mit Bibliothek-Template · Änderungen in der Bibliothek übernehmen den Prompt hier.
                </span>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="py-1.5 px-3 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                📋 Kopieren
              </button>
              {!promptEditing ? (
                <>
                  <button
                    type="button"
                    onClick={startPromptEdit}
                    className="py-1.5 px-3 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetPromptConfirmOpen(true)}
                    className="py-1.5 px-3 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    Zurücksetzen
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={cancelPromptEdit}
                    className="py-1.5 px-3 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={savePromptEdit}
                    disabled={updateArtifact.isPending || !hasPromptEdit}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {updateArtifact.isPending ? 'Speichern…' : 'Speichern'}
                  </button>
                </>
              )}
            </div>
          </div>
          {promptEditing ? (
            <textarea
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              placeholder="Prompt-Template mit Platzhaltern z.B. [KATEGORIE], [INPUT A]…"
              className="w-full min-h-[160px] p-3 rounded-lg bg-white border border-slate-200 font-mono text-xs text-slate-700 placeholder:text-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          ) : (
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-3.5 font-mono text-xs leading-relaxed text-slate-600 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {promptResolved}
            </div>
          )}
          {updateArtifact.isError && (
            <p className="mt-1.5 text-xs text-red-600" role="alert">
              {updateArtifact.error?.message}
            </p>
          )}
        </section>

        {/* Phase-Input Referenz */}
        <PhaseInputReference phase={artifact.phase} categoryId={artifact.category_id} />

        {/* Ergebnis */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
              Ergebnis
            </span>
            <button
              type="button"
              onClick={handleCopyResult}
              disabled={!displayResultText}
              className="py-1 px-2 rounded text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              📄 Kopieren
            </button>
          </div>
          {latestResult && (
            <div className="flex gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-2xs font-mono font-medium bg-white border border-slate-200 text-slate-500">
                {latestResult.source ?? 'manual'}
              </span>
              <span className="px-2 py-0.5 rounded text-2xs font-mono font-medium bg-white border border-slate-200 text-slate-500">
                v{latestResult.version}
              </span>
            </div>
          )}
          {isLoading ? (
            <p className="text-sm text-slate-500">Laden…</p>
          ) : (
            <textarea
              value={draftText !== '' ? draftText : (latestResult?.result_text ?? '')}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Ergebnis hier einfügen oder eingeben …"
              className="w-full min-h-[120px] max-h-[220px] p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 placeholder:text-slate-500 resize-y font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          )}
          {(hasUnsavedEdit || (!latestResult && draftText.trim())) && (
            <button
              type="button"
              onClick={handleSaveResult}
              disabled={saving}
              className="mt-2 py-1.5 px-3 rounded-xl text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Speichern…' : 'Ergebnis speichern'}
            </button>
          )}
        </section>

        {/* Notiz */}
        <section>
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500 block mb-2.5">
            Notiz
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Eigene Notizen …"
            className="w-full min-h-[70px] p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 placeholder:text-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-100 flex flex-col gap-2 flex-shrink-0">
        <div className="flex gap-2 flex-wrap">
          {onSaveAsTemplate && (
            <button
              type="button"
              onClick={() => onSaveAsTemplate(artifact)}
              className="py-2 px-3 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              💾 Als Template speichern
            </button>
          )}
          {onDeleteArtifact && (
            <button
              type="button"
              onClick={() => onDeleteArtifact(artifact)}
              className="py-2 px-3 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              🗑 Artefakt löschen
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            📋 Alles kopieren
          </button>
          <button
            type="button"
            onClick={handleAbschliessen}
            disabled={finishing || (status === 'done')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {finishing ? '…' : '✓ Abschließen'}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={resetPromptConfirmOpen}
        title="Prompt zurücksetzen?"
        message="Das Prompt-Template dieses Artefakts wird geleert. Diese Aktion können Sie durch erneutes Bearbeiten rückgängig machen."
        confirmLabel="Zurücksetzen"
        variant="danger"
        onConfirm={handleResetPrompt}
        onCancel={() => setResetPromptConfirmOpen(false)}
        isLoading={updateArtifact.isPending}
      />
    </div>
  )
}
