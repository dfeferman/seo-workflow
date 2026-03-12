import { useRef, useCallback } from 'react'
import { replacePlaceholders } from '@/utils/replacePlaceholders'
import { usePlaceholderData } from '@/hooks/usePlaceholderData'
import type { CategoryRow } from '@/types/database.types'

const PLACEHOLDERS = [
  '[KATEGORIE]', '[ZIELGRUPPEN]', '[USPs]', '[TON]', '[NO-GOS]', '[SHOP-TYP]',
  '[INPUT A]', '[INPUT B]', '[INPUT C]', '[INPUT D]', '[INPUT E]',
  '[BRIEFING]', '[TEXT]', '[LINKS]',
]

type PromptEditorProps = {
  value: string
  onChange: (value: string) => void
  category: CategoryRow | null
  categoryId?: string
  placeholder?: string
}

export function PromptEditor({
  value,
  onChange,
  category,
  categoryId,
  placeholder = 'Prompt mit Platzhaltern eingeben…',
}: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { placeholderMap } = usePlaceholderData(categoryId ?? undefined)

  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const before = value.slice(0, start)
      const after = value.slice(end)
      onChange(before + text + after)
      requestAnimationFrame(() => {
        const newPos = start + text.length
        ta.focus()
        ta.setSelectionRange(newPos, newPos)
      })
    },
    [value, onChange]
  )

  const previewText = replacePlaceholders(value, category, placeholderMap)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">
          Prompt <span className="text-red-600">*</span>
          <span className="ml-2 text-2xs text-slate-500 font-mono font-normal">
            Platzhalter: [KATEGORIE], [ZIELGRUPPEN], [INPUT A], [BRIEFING], [TEXT], …
          </span>
        </label>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={8}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-accent resize-y min-h-[180px]"
        />
        <div className="text-2xs text-slate-500 font-mono text-right mt-1">
          {value.length} Zeichen
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Verfügbare Platzhalter
        </label>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => insertAtCursor(p)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:border-accent hover:bg-indigo-50 hover:text-blue-600 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Prompt-Vorschau
        </label>
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-600 leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap">
          {previewText || (
            <span className="text-slate-500">Vorschau wird angezeigt, sobald Platzhalter ersetzt werden.</span>
          )}
        </div>
        <p className="text-2xs text-slate-500 mt-1.5">
          So sieht der Prompt mit den Kategorie-Daten aus.
        </p>
      </div>
    </div>
  )
}
