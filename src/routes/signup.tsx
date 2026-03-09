import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) {
        setError(err.message)
        return
      }
      setSuccess(true)
      setTimeout(() => navigate({ to: '/' }), 1500)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-2xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Konto erstellt</h2>
          <p className="text-sm text-slate-500">
            Du wirst gleich weitergeleitet. Prüfe ggf. deine E-Mails zur Bestätigung.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SEO Workflow</h1>
            <p className="text-xs text-slate-500">Konto anlegen</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">
              E-Mail
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="deine@email.de"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1">
              Passwort
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="••••••••"
            />
            <p className="text-xs text-slate-500 mt-1">Mindestens 6 Zeichen</p>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {loading ? 'Wird erstellt…' : 'Konto anlegen'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500 text-center">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
