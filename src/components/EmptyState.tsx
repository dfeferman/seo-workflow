/**
 * Einheitliche Empty States für leere Listen/Bereiche.
 * Step 15: Polish – klare leere Zustände.
 */

import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center animate-[slideUp_0.25s_ease-out] ${className}`}
      role="status"
      aria-label={title}
    >
      <span className="text-4xl mb-3 opacity-80" aria-hidden>
        {icon}
      </span>
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
