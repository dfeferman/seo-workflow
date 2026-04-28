import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiClient } from '@/lib/apiClient'
import type { PageLinkRow, PageRow } from '@/types/database.types'

type Props = {
  open: boolean
  link: PageLinkRow | null
  fromPage: PageRow | null
  projectId: string
  onClose: () => void
  onSaved?: () => void
}

export function LinkEditModal({ open, link, fromPage, projectId, onClose, onSaved }: Props) {
  const qc = useQueryClient()
  const [anchorText, setAnchorText] = useState('')
  const [contextSentence, setContextSentence] = useState('')
  const [placement, setPlacement] = useState('')
  const [lineStart, setLineStart] = useState('')
  const [lineEnd, setLineEnd] = useState('')

  useEffect(() => {
    if (!link) return
    setAnchorText(link.anchor_text ?? '')
    setContextSentence(link.context_sentence ?? '')
    setPlacement(link.placement ?? '')
    setLineStart(link.line_number_start != null ? String(link.line_number_start) : '')
    setLineEnd(link.line_number_end != null ? String(link.line_number_end) : '')
  }, [link])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!link) throw new Error('Kein Link')
      const parseOptInt = (s: string): number | null => {
        const t = s.trim()
        if (!t) return null
        const n = Number.parseInt(t, 10)
        if (!Number.isFinite(n)) throw new Error('Zeilen müssen ganze Zahlen sein')
        return n
      }
      const ls = parseOptInt(lineStart)
      const le = lineEnd.trim() ? parseOptInt(lineEnd) : ls
      return apiClient.pageLinks.update(link.id, {
        anchor_text: anchorText.trim() || null,
        context_sentence: contextSentence.trim() || null,
        placement: placement.trim() || null,
        line_number_start: ls,
        line_number_end: le,
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['page-links', projectId] })
      await qc.invalidateQueries({ queryKey: ['pages', projectId] })
      onSaved?.()
      onClose()
    },
  })

  if (!open || !link) return null

  const errMsg = mutation.error instanceof Error ? mutation.error.message : null

  const content = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-edit-title"
      onClick={(e) => e.target === e.currentTarget && !mutation.isPending && onClose()}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
        <h2 id="link-edit-title" className="text-base font-bold text-slate-900 mb-1">
          Link bearbeiten
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Von: <span className="font-medium text-slate-700">{fromPage?.name ?? '—'}</span>
        </p>

        {errMsg && (
          <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errMsg}</p>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">Anker-Text</span>
            <input
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              disabled={mutation.isPending}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">Kontextsatz</span>
            <textarea
              value={contextSentence}
              onChange={(e) => setContextSentence(e.target.value)}
              disabled={mutation.isPending}
              rows={3}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-y min-h-[72px]"
            />
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">Platzierung</span>
            <input
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              disabled={mutation.isPending}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">Zeile von</span>
              <input
                value={lineStart}
                onChange={(e) => setLineStart(e.target.value)}
                disabled={mutation.isPending}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </label>
            <label className="block">
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wide">Zeile bis</span>
              <input
                value={lineEnd}
                onChange={(e) => setLineEnd(e.target.value)}
                disabled={mutation.isPending}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
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
