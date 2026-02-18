import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const signedInSuccess = useRef(false)

  useEffect(() => {
    if (signedInSuccess.current && user) {
      signedInSuccess.current = false
      navigate({ to: '/' })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
        return
      }
      signedInSuccess.current = true
      // Navigation passiert im useEffect, sobald der AuthProvider den User gesetzt hat
    } finally {
      setLoading(false)
    }
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
            <p className="text-2xs text-muted">Anmelden</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
              E-Mail
            </label>
            <input
              id="email"
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
            <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="••••••••"
            />
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
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted text-center">
          Noch kein Konto?{' '}
          <Link to="/signup" className="text-accent font-medium hover:underline">
            Konto anlegen
          </Link>
        </p>
      </div>
    </div>
  )
}
