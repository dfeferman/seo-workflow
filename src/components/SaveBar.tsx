type Props = {
  show: boolean
  onSave: () => void
  onDiscard: () => void
  isSaving?: boolean
  saveError?: string | null
}

export function SaveBar({ show, onSave, onDiscard, isSaving, saveError }: Props) {
  if (!show) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:left-[280px] py-4 px-7 bg-white border-t border-slate-200 flex flex-col gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-[100]"
      style={{ animation: 'slideUp 0.2s ease' }}
      role="region"
      aria-label="Ungespeicherte Änderungen"
    >
      {saveError && (
        <p className="text-sm text-red-600" role="alert">
          {saveError}
        </p>
      )}
      <div className="flex justify-between items-center">
      <span className="text-sm text-slate-500">Ungespeicherte Änderungen</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Verwerfen
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      </div>
    </div>
  )
}
