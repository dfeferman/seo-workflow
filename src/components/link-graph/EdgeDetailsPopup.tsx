import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { PageLinkRow, PageRow } from '@/types/database.types'
import { LinkEditModal } from './LinkEditModal'

type Props = {
  open: boolean
  onClose: () => void
  fromPage: PageRow
  toPage: PageRow
  links: PageLinkRow[]
  projectId: string
}

function lineLabel(link: PageLinkRow): string {
  const a = link.line_number_start
  const b = link.line_number_end
  if (a != null && b != null && a !== b) return `Zeilen ${a}–${b}`
  if (a != null) return `Zeile ${a}`
  return '—'
}

export function EdgeDetailsPopup({ open, onClose, fromPage, toPage, links, projectId }: Props) {
  const [editingLink, setEditingLink] = useState<PageLinkRow | null>(null)

  const handleCloseAll = () => {
    setEditingLink(null)
    onClose()
  }

  if (!open) return null

  const canOpenEditor = Boolean(fromPage.markdown_file_path)

  const content = (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edge-details-title"
        onClick={(e) => e.target === e.currentTarget && handleCloseAll()}
      >
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100 flex-shrink-0">
            <div className="min-w-0">
              <h2 id="edge-details-title" className="text-sm font-semibold text-slate-900">
                Verlinkung
              </h2>
              <p className="text-xs text-slate-600 mt-1 break-words">
                <span className="font-medium text-slate-800">{fromPage.name}</span>
                <span className="text-slate-400 mx-1">→</span>
                <span className="font-medium text-slate-800">{toPage.name}</span>
              </p>
              <p className="text-2xs text-slate-400 mt-1">
                {links.length} Link-Instanz{links.length === 1 ? '' : 'en'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseAll}
              className="flex-shrink-0 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              aria-label="Schließen"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="border border-slate-100 rounded-lg p-3 text-xs space-y-2 bg-slate-50/50"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">
                    Instanz
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingLink(link)}
                    className="text-2xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Bearbeiten…
                  </button>
                </div>
                <div>
                  <span className="text-slate-500">Anker: </span>
                  <span className="text-slate-800 font-medium">
                    {link.anchor_text?.trim() ? `„${link.anchor_text}"` : '—'}
                  </span>
                </div>
                {link.context_sentence?.trim() && (
                  <div>
                    <span className="text-slate-500 block mb-0.5">Kontext</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{link.context_sentence}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                  <span>
                    <span className="text-slate-400">Platzierung: </span>
                    {link.placement?.trim() || '—'}
                  </span>
                  <span>
                    <span className="text-slate-400">Position: </span>
                    {lineLabel(link)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 flex-shrink-0 space-y-2">
            <button
              type="button"
              disabled={!canOpenEditor}
              title={
                canOpenEditor
                  ? 'Interne Vorschau folgt (SP25)'
                  : 'Kein Markdown-Pfad auf der Quell-Seite'
              }
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
            >
              Im Editor öffnen
            </button>
          </div>
        </div>
      </div>

      <LinkEditModal
        open={editingLink != null}
        link={editingLink}
        fromPage={fromPage}
        projectId={projectId}
        onClose={() => setEditingLink(null)}
      />
    </>
  )

  return createPortal(content, document.body)
}
