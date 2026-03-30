import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { apiClient } from '@/lib/apiClient'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const result = await apiClient.auth.resetPassword(token, password)
      setMessage(result.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Passwort konnte nicht geaendert werden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Neues Passwort setzen</h1>
        <p className="text-sm text-slate-500 mb-6">
          {token ? 'Vergib ein neues Passwort fuer dein Konto.' : 'Der Reset-Link ist unvollstaendig.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700 mb-1">
              Neues Passwort
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={!token}
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100"
            />
          </div>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Speichern...' : 'Passwort speichern'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500 text-center">
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  )
}
