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
      className="fixed bottom-0 left-0 right-0 md:left-[280px] py-4 px-7 bg-surface border-t border-border flex flex-col gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-[100]"
      style={{ animation: 'slideUp 0.2s ease' }}
      role="region"
      aria-label="Ungespeicherte Änderungen"
    >
      {saveError && (
        <p className="text-sm text-red" role="alert">
          {saveError}
        </p>
      )}
      <div className="flex justify-between items-center">
      <span className="text-sm text-muted">Ungespeicherte Änderungen</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-lg border border-border bg-surface text-text-secondary text-sm font-semibold hover:bg-surface-2 hover:text-text disabled:opacity-50"
        >
          Verwerfen
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold shadow-sm hover:bg-[#4a6fef] disabled:opacity-50"
        >
          {isSaving ? 'Wird gespeichert…' : 'Speichern'}
        </button>
      </div>
      </div>
    </div>
  )
}
