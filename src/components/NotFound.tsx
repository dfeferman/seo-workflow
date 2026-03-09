import { Link } from '@tanstack/react-router'

/**
 * 404 – Seite nicht gefunden.
 * Wird von TanStack Router genutzt, wenn keine Route passt.
 */
export function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6"
      role="status"
      aria-label="Seite nicht gefunden"
    >
      <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="text-5xl mb-4 opacity-80">🔍</div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Seite nicht gefunden</h1>
        <p className="text-sm text-slate-500 mb-6">
          Die angeforderte Seite existiert nicht. Zurück zur Startseite?
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  )
}
