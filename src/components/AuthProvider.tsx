import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiClient, setToken, clearToken } from '@/lib/apiClient'

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

function normalizeUser(u: unknown): AppUser | null {
  if (!u || typeof u !== 'object') return null
  const row = u as {
    id?: string
    email?: string
    is_superadmin?: boolean
    is_approved?: boolean
  }
  if (
    typeof row.id !== 'string' ||
    typeof row.email !== 'string' ||
    typeof row.is_superadmin !== 'boolean' ||
    typeof row.is_approved !== 'boolean'
  ) {
    return null
  }
  return {
    id: row.id,
    email: row.email,
    is_superadmin: row.is_superadmin,
    is_approved: row.is_approved,
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
