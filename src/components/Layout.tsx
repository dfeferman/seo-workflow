import { type ReactNode } from 'react'
import { ProjectSidebar } from './ProjectSidebar'

type LayoutProps = {
  children: ReactNode
}

/**
 * Basis-Layout: Sidebar (links) + Main-Bereich (rechts).
 * Sidebar: Projekt-/Kategorieliste (Referenz: html-referenz/seo-workflow-with-blog.html).
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside
        className="w-[280px] min-w-[280px] flex flex-col bg-surface border-r border-border"
        aria-label="Projekt-Navigation"
      >
        <div className="p-5 pb-4 border-b border-border flex items-center gap-3 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-[#7c3aed] flex items-center justify-center text-white font-bold text-base shadow-sm"
            aria-hidden
          >
            S
          </div>
          <div>
            <div className="text-[15px] font-semibold text-text tracking-tight">
              SEO Workflow
            </div>
            <div className="text-2xs text-muted font-mono tracking-wide">Platform</div>
          </div>
        </div>
        <ProjectSidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-surface2">
        {children}
      </div>
    </div>
  )
}
