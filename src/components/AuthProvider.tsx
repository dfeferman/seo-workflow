import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiClient, setToken, clearToken } from '@/lib/apiClient'

type AppUser = { id: string; email: string }

type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  signOut: () => void
  signIn: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function normalizeUser(u: unknown): AppUser | null {
  if (!u || typeof u !== 'object') return null
  const row = u as { id?: string; email?: string }
  if (typeof row.id !== 'string' || typeof row.email !== 'string') return null
  return { id: row.id, email: row.email }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Beim App-Start: Session via Refresh-Token-Cookie wiederherstellen
  useEffect(() => {
    apiClient.auth
      .refresh()
      .then(({ token, user: u }) => {
        setToken(token)
        setUser(normalizeUser(u))
      })
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Beim apiClient-seitigen Signout-Event (z.B. Refresh fehlgeschlagen nach Retry)
  useEffect(() => {
    const handleSignout = () => setUser(null)
    window.addEventListener('auth:signout', handleSignout)
    return () => window.removeEventListener('auth:signout', handleSignout)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiClient.auth.login(email, password)
    setToken(token)
    setUser(normalizeUser(u))
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiClient.auth.register(email, password)
    setToken(token)
    setUser(normalizeUser(u))
  }, [])

  const signOut = useCallback(() => {
    apiClient.auth.logout().catch(() => {}) // best effort
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
