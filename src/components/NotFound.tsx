import { Link } from '@tanstack/react-router'

/**
 * 404 – Seite nicht gefunden.
 * Wird von TanStack Router genutzt, wenn keine Route passt.
 */
export function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-bg p-6"
      role="status"
      aria-label="Seite nicht gefunden"
    >
      <div className="max-w-md w-full rounded-xl border border-border bg-surface p-8 shadow-sm text-center">
        <div className="text-5xl mb-4 opacity-80">🔍</div>
        <h1 className="text-2xl font-semibold text-text mb-2">Seite nicht gefunden</h1>
        <p className="text-sm text-muted mb-6">
          Die angeforderte Seite existiert nicht. Zurück zur Startseite?
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-[#4a6fef] transition-colors"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  )
}
