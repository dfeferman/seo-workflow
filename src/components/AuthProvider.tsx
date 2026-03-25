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

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    apiClient.auth
      .me()
      .then((u) => setUser(normalizeUser(u)))
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
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
