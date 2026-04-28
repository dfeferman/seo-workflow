import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiClient } from '@/lib/apiClient'
import type { PageRow } from '@/types/database.types'

type Props = {
  open: boolean
  projectId: string
  pages: PageRow[]
  onClose: () => void
}

export function AddLinkModal({ open, projectId, pages, onClose }: Props) {
  const qc = useQueryClient()
  const sorted = useMemo(() => [...pages].sort((a, b) => a.name.localeCompare(b.name, 'de')), [pages])

  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [anchor, setAnchor] = useState('')
  const [context, setContext] = useState('')
  const [placement, setPlacement] = useState('')
  const [lineStart, setLineStart] = useState('')
  const [lineEnd, setLineEnd] = useState('')

  useEffect(() => {
    if (!open) return
    setFromId('')
    setToId('')
    setAnchor('')
    setContext('')
    setPlacement('')
    setLineStart('')
    setLineEnd('')
    if (sorted.length >= 2) {
      setFromId(sorted[0].id)
      setToId(sorted[1].id)
    } else if (sorted.length === 1) {
      setFromId(sorted[0].id)
    }
  }, [open, sorted])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!fromId || !toId) throw new Error('Quelle und Ziel wählen')
      if (fromId === toId) throw new Error('Quelle und Ziel müssen verschieden sein')
      const parseOptInt = (s: string): number | null => {
        const t = s.trim()
        if (!t) return null
        const n = Number.parseInt(t, 10)
        if (!Number.isFinite(n)) throw new Error('Zeilen müssen Zahlen sein')
        return n
      }
      const ls = parseOptInt(lineStart)
      const le = lineEnd.trim() ? parseOptInt(lineEnd) : ls
      return apiClient.pageLinks.create({
        project_id: projectId,
        from_page_id: fromId,
        to_page_id: toId,
        anchor_text: anchor.trim() || null,
        context_sentence: context.trim() || null,
        placement: placement.trim() || null,
        line_number_start: ls,
        line_number_end: le,
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['pages', projectId] })
      await qc.invalidateQueries({ queryKey: ['page-links', projectId] })
      onClose()
    },
  })

  if (!open) return null

  const errMsg = mutation.error instanceof Error ? mutation.error.message : null

  const content = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && !mutation.isPending && onClose()}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <h2 className="text-base font-bold text-slate-900 mb-4">Link anlegen</h2>
        {sorted.length < 2 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
            Mindestens zwei Seiten werden benötigt (oder zuerst eine weitere Seite anlegen).
          </p>
        )}
        {errMsg && (
          <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errMsg}</p>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Von Seite</span>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">— wählen —</option>
              {sorted.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === toId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Ziel-Seite</span>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">— wählen —</option>
              {sorted.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === fromId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Anker-Text</span>
            <input
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              placeholder="optional"
            />
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Kontext</span>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-y"
              placeholder="optional"
            />
          </label>
          <label className="block">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Platzierung</span>
            <input
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              placeholder="optional"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-2xs font-semibold text-slate-500 uppercase">Zeile von</span>
              <input
                value={lineStart}
                onChange={(e) => setLineStart(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                placeholder="optional"
              />
            </label>
            <label className="block">
              <span className="text-2xs font-semibold text-slate-500 uppercase">Zeile bis</span>
              <input
                value={lineEnd}
                onChange={(e) => setLineEnd(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                placeholder="optional"
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
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || sorted.length < 2 || !fromId || !toId || fromId === toId}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {mutation.isPending ? 'Speichern …' : 'Link speichern'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
