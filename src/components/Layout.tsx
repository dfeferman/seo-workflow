import { type ReactNode, useState, useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { ProjectSidebar } from './ProjectSidebar'

type LayoutProps = {
  children: ReactNode
}

/**
 * Basis-Layout: Sidebar (links) + Main-Bereich (rechts).
 * Responsive: Auf kleinen Bildschirmen Sidebar als Overlay mit Hamburger-Button (Step 15).
 */
export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setSidebarOpen(false), [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile: Overlay wenn Sidebar offen */}
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Sidebar schließen"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[280px] min-w-[280px] flex flex-col bg-white border-r border-slate-100
          transform transition-transform duration-200 ease-out
          lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Projekt-Navigation"
      >
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0"
            aria-hidden
          >
            S
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold leading-none tracking-tight text-slate-900">
              SEO Workflow
            </div>
            <div className="text-xs text-slate-500 tracking-wide">Platform</div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Sidebar schließen"
          >
            ✕
          </button>
        </div>
        <ProjectSidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-50 relative">
        {/* Hamburger: nur auf Mobile sichtbar */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-900"
          aria-label="Menü öffnen"
        >
          ☰
        </button>
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pt-14 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  )
}
