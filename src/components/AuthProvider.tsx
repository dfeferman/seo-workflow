import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiClient, setToken, clearToken, getToken } from '@/lib/apiClient'

export type AppUser = {
  id: string
  email: string
  is_superadmin: boolean
  is_approved: boolean
}

type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  signOut: () => void
  signIn: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toBool(v: unknown): boolean {
  if (v === true) return true
  if (v === false || v == null) return false
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') {
    const s = v.toLowerCase()
    return s === 'true' || s === '1' || s === 't'
  }
  return false
}

function normalizeUser(u: unknown): AppUser | null {
  if (!u || typeof u !== 'object') return null
  const row = u as {
    id?: string
    email?: string
    is_superadmin?: unknown
    is_approved?: unknown
  }
  if (typeof row.id !== 'string' || typeof row.email !== 'string') {
    return null
  }
  return {
    id: row.id,
    email: row.email,
    is_superadmin: toBool(row.is_superadmin),
    is_approved: toBool(row.is_approved),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const handleSignout = () => setUser(null)
    window.addEventListener('auth:signout', handleSignout)
    return () => window.removeEventListener('auth:signout', handleSignout)
  }, [])

  useEffect(() => {
    const onSessionRefreshed = (e: Event) => {
      const detail = (e as CustomEvent<{ user?: unknown }>).detail
      const n = normalizeUser(detail?.user)
      if (n) setUser(n)
    }
    window.addEventListener('auth:session-refreshed', onSessionRefreshed)
    return () => window.removeEventListener('auth:session-refreshed', onSessionRefreshed)
  }, [])

  /** Rollen/Flags aus DB nachziehen (z. B. nach Superadmin-UPDATE), ohne Full-Reload */
  useEffect(() => {
    const syncFromServer = () => {
      if (document.visibilityState !== 'visible') return
      if (!getToken()) return
      void apiClient.auth
        .me()
        .then((raw) => {
          const n = normalizeUser(raw)
          if (n) setUser(n)
        })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', syncFromServer)
    return () => document.removeEventListener('visibilitychange', syncFromServer)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiClient.auth.login(email, password)
    setToken(token)
    setUser(normalizeUser(u))
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { message } = await apiClient.auth.register(email, password)
    clearToken()
    setUser(null)
    return message
  }, [])

  const signOut = useCallback(() => {
    apiClient.auth.logout().catch(() => {})
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
