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
    <div className="flex h-screen overflow-hidden bg-bg">
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
          w-[280px] min-w-[280px] flex flex-col bg-surface border-r border-border
          transform transition-transform duration-200 ease-out
          lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Projekt-Navigation"
      >
        <div className="p-5 pb-4 border-b border-border flex items-center gap-3 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-[#7c3aed] flex items-center justify-center text-white font-bold text-base shadow-sm"
            aria-hidden
          >
            S
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-text tracking-tight">
              SEO Workflow
            </div>
            <div className="text-2xs text-muted font-mono tracking-wide">Platform</div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-9 h-9 rounded-lg border border-border bg-surface text-muted hover:bg-surface-2 flex items-center justify-center"
            aria-label="Sidebar schließen"
          >
            ✕
          </button>
        </div>
        <ProjectSidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-surface2 relative">
        {/* Hamburger: nur auf Mobile sichtbar */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 w-10 h-10 rounded-lg bg-surface border border-border shadow-sm flex items-center justify-center text-text"
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
