import { createPortal } from 'react-dom'
import { replacePlaceholders } from '@/utils/replacePlaceholders'
import { buildCategoryMarkdown, buildCombinedResultsText } from '@/utils/exportCategory'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useCategory } from '@/hooks/useCategory'
import { useArtifacts } from '@/hooks/useArtifacts'
import { usePlaceholderData } from '@/hooks/usePlaceholderData'
import type { CategoryRow } from '@/types/database.types'

type Props = {
  open: boolean
  onClose: () => void
  categoryId: string
  onCopyFlash?: (message: string) => void
}

export function ExportModal({ open, onClose, categoryId, onCopyFlash }: Props) {
  const { data: category } = useCategory(categoryId)
  const { data: artifacts = [] } = useArtifacts(categoryId)
  const { placeholderMap, latestResultByArtifactId, isLoading } = usePlaceholderData(categoryId)
  const { copyToClipboard } = useCopyToClipboard({
    onSuccess: onCopyFlash,
    defaultMessage: 'Kopiert!',
  })

  const exportItems = artifacts.map((artifact) => ({
    artifact,
    resolvedPrompt: replacePlaceholders(artifact.prompt_template, category ?? null, placeholderMap),
    resultText: latestResultByArtifactId[artifact.id] ?? null,
  }))

  const handleCopyAllResults = async () => {
    const text = buildCombinedResultsText(exportItems)
    const ok = await copyToClipboard(text, 'Alle Ergebnisse kopiert!')
    if (ok) onClose()
  }

  const handleDownloadMarkdown = () => {
    const categoryName = category?.name ?? 'Kategorie'
    const markdown = buildCategoryMarkdown(categoryName, exportItems)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${categoryName.replace(/[^\wäöüÄÖÜß\-]/g, '_')}_Export.md`
    a.click()
    URL.revokeObjectURL(url)
    onClose()
  }

  if (!open) return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-border flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 id="export-modal-title" className="text-lg font-bold text-text">
              Export
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {category?.name ?? '…'} · {artifacts.length} Artefakt{artifacts.length !== 1 ? 'e' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border bg-surface text-muted hover:bg-surface-2 hover:text-text flex items-center justify-center"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted">Daten werden geladen…</p>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCopyAllResults}
                className="w-full py-3 px-4 rounded-lg text-sm font-semibold border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text flex items-center justify-center gap-2"
              >
                📋 Alle Ergebnisse kopieren
              </button>
              <p className="text-2xs text-muted">
                Kombiniert alle Artefakt-Ergebnisse in die Zwischenablage.
              </p>

              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="w-full py-3 px-4 rounded-lg text-sm font-semibold border border-accent bg-accent text-white hover:bg-[#4a6fef] flex items-center justify-center gap-2"
              >
                ⬇ Als Markdown herunterladen
              </button>
              <p className="text-2xs text-muted">
                Alle Artefakte inkl. Prompt und Ergebnis als .md-Datei.
              </p>

              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-lg text-sm font-medium border border-border bg-surface-2 text-muted cursor-not-allowed flex items-center justify-center gap-2"
                title="Demnächst verfügbar"
              >
                📄 Als Word exportieren (demnächst)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
