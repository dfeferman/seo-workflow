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
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green/20 flex items-center justify-center text-green text-2xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-lg font-semibold text-text mb-2">Konto erstellt</h2>
          <p className="text-sm text-muted">
            Du wirst gleich weitergeleitet. Prüfe ggf. deine E-Mails zur Bestätigung.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-[#7c3aed] flex items-center justify-center text-white font-bold">
            S
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text">SEO Workflow</h1>
            <p className="text-2xs text-muted">Konto anlegen</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-text mb-1">
              E-Mail
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="deine@email.de"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-text mb-1">
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
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="••••••••"
            />
            <p className="text-2xs text-muted mt-1">Mindestens 6 Zeichen</p>
          </div>
          {error && (
            <p className="text-sm text-red" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-[#4a6fef] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird erstellt…' : 'Konto anlegen'}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted text-center">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
