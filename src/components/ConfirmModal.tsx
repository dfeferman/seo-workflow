import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  variant?: 'danger' | 'neutral'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: Props) {
  if (!open) return null

  const isDanger = variant === 'danger'

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-5">
        <h2 id="confirm-modal-title" className="text-lg font-bold text-text mb-2">
          {title}
        </h2>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`min-w-[100px] px-4 py-2 rounded-lg text-sm font-semibold text-white flex-shrink-0 ${
              isDanger
                ? 'bg-red hover:opacity-90'
                : 'bg-accent hover:bg-[#4a6fef]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
