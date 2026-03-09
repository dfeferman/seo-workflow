/**
 * Wiederverwendbare Loading-Skeletons für Listen, Tabellen und Karten.
 * Step 15: Polish – einheitliche Ladeanzeigen.
 */

const shimmer = 'animate-pulse bg-slate-100'

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-4 rounded ${shimmer} ${className}`}
      role="presentation"
      aria-hidden
    />
  )
}

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg ${shimmer} ${className}`}
      role="presentation"
      aria-hidden
    />
  )
}

/** Für Projekt-Sidebar: eine Zeile (Icon + Text + Badge). */
export function SidebarProjectSkeleton() {
  return (
    <div className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg">
      <div className="w-5 h-5 rounded flex-shrink-0 bg-slate-100 animate-pulse" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="w-5 h-5 rounded flex-shrink-0 bg-slate-100 animate-pulse" />
    </div>
  )
}

/** Liste von Projekt-Skeletons für die Sidebar. */
export function SidebarProjectsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }, (_, i) => (
        <SidebarProjectSkeleton key={i} />
      ))}
    </div>
  )
}

/** Eine Kategorie-Zeile in der Sidebar. */
export function SidebarCategorySkeleton() {
  return (
    <div className="flex items-center gap-1 py-1.5 px-2.5 rounded-md">
      <div className="flex-1 h-4 rounded bg-slate-100 animate-pulse" />
      <div className="w-10 h-5 rounded bg-slate-100 animate-pulse flex-shrink-0" />
    </div>
  )
}

export function SidebarCategoriesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0.5 ml-2 border-l-2 border-slate-200 pl-2">
      {Array.from({ length: count }, (_, i) => (
        <SidebarCategorySkeleton key={i} />
      ))}
    </div>
  )
}

/** Eine Tabellenzeile für die Workflow-Tabelle (Phase + Name + Status + Aktionen). */
export function WorkflowTableRowSkeleton() {
  return (
    <tr className="border-b border-slate-200/80">
      <td className="py-4 px-6">
        <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse" />
      </td>
      <td className="py-4 px-6 space-y-2">
        <div className="h-4 w-52 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-3 w-36 rounded-md bg-slate-100/80 animate-pulse" />
      </td>
      <td className="py-4 px-6">
        <div className="h-5 w-24 rounded-md bg-slate-100 animate-pulse" />
      </td>
      <td className="py-4 px-6">
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-9 w-20 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-9 w-12 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </td>
    </tr>
  )
}

/** Vollständige Workflow-Tabelle als Skeleton. */
export function WorkflowTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex-1 overflow-y-auto bg-white/80 backdrop-blur-[2px] min-h-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-[0_1px_0_0_#e2e8f0]">
            <th className="text-left py-4 px-6 w-[72px] font-sans text-xs tracking-widest uppercase text-slate-500 font-semibold">
              Phase
            </th>
            <th className="text-left py-4 px-6 font-sans text-xs tracking-widest uppercase text-slate-500 font-semibold">
              Artefakt
            </th>
            <th className="text-left py-4 px-6 w-[140px] font-sans text-xs tracking-widest uppercase text-slate-500 font-semibold">
              Status
            </th>
            <th className="text-left py-4 px-6 w-[240px] font-sans text-xs tracking-widest uppercase text-slate-500 font-semibold">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <WorkflowTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Template-Karte im Grid (TemplateBrowser). */
export function TemplateCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
      <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
      <div className="h-9 w-full rounded-lg bg-slate-100 animate-pulse" />
    </div>
  )
}

export function TemplateGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <TemplateCardSkeleton key={i} />
      ))}
    </div>
  )
}
