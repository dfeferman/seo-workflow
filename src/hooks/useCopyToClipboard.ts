import { useCallback } from 'react'

type UseCopyToClipboardOptions = {
  onSuccess?: (message: string) => void
  defaultMessage?: string
}

/**
 * Hook zum Kopieren von Text in die Zwischenablage.
 * Ruft onSuccess mit der gewünschten Nachricht auf (z. B. für Toast "Kopiert!").
 */
export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}) {
  const { onSuccess, defaultMessage = 'Kopiert!' } = options

  const copyToClipboard = useCallback(
    async (text: string, successMessage?: string): Promise<boolean> => {
      if (!text || typeof text !== 'string') return false
      try {
        await navigator.clipboard.writeText(text)
        onSuccess?.(successMessage ?? defaultMessage)
        return true
      } catch {
        return false
      }
    },
    [onSuccess, defaultMessage]
  )

  return { copyToClipboard }
}
