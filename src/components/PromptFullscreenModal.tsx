import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  title: string
  body: string
  onClose: () => void
  /** Angezeigt wenn `body` nach trim leer ist */
  emptyMessage?: string
}

export function PromptFullscreenModal({
  open,
  title,
  body,
  onClose,
  emptyMessage = '(Kein Prompt-Inhalt)',
}: Props) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 id={titleId} className="text-lg font-bold text-slate-900 pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center text-base flex-shrink-0 transition-colors"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {body.trim() ? (
            <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap break-words m-0">
              {body}
            </pre>
          ) : (
            <p className="text-sm text-slate-500 m-0">{emptyMessage}</p>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
