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
  const isPublicPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Laden…</p>
      </div>
    )
  }

  if (isPublicPage) {
    return <Outlet />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (!user.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-800 mb-2">Konto wartet auf Freigabe</h1>
          <p className="text-sm text-slate-500 mb-6">
            Dein Konto wurde erfolgreich erstellt. Ein Administrator muss deinen Zugang noch freischalten.
          </p>
          <button
            onClick={() => {
              import('@/lib/apiClient').then(({ clearToken }) => clearToken())
              window.location.href = '/login'
            }}
            className="text-sm text-slate-400 hover:text-slate-600 underline"
          >
            Abmelden
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center bg-slate-100">
            <p className="text-slate-500 text-sm">Laden…</p>
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </Layout>
  )
}
