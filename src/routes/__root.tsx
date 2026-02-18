import { Suspense } from 'react'
import { createRootRoute, Outlet, useLocation, Navigate } from '@tanstack/react-router'
import { Layout } from '@/components/Layout'
import { NotFound } from '@/components/NotFound'
import { useAuth } from '@/hooks/useAuth'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  const { pathname } = useLocation()
  const { user, loading } = useAuth()
  const isPublicPage = pathname === '/login' || pathname === '/signup'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Laden…</p>
      </div>
    )
  }

  if (isPublicPage) {
    return <Outlet />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center bg-surface2">
            <p className="text-muted text-sm">Laden…</p>
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </Layout>
  )
}
