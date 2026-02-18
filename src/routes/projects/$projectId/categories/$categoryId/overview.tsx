import { createFileRoute, Link } from '@tanstack/react-router'
import { useProject } from '@/hooks/useProject'
import { useCategory } from '@/hooks/useCategory'
import { useStats } from '@/hooks/useStats'
import { DashboardCards } from '@/components/DashboardCards'

export const Route = createFileRoute('/projects/$projectId/categories/$categoryId/overview')({
  component: OverviewPage,
})

function OverviewPage() {
  const { projectId, categoryId } = Route.useParams()
  const { data: project } = useProject(projectId)
  const { data: category } = useCategory(categoryId)
  const { data: stats, isLoading } = useStats(categoryId)

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg">
      <div className="flex items-center justify-between h-16 px-7 border-b border-border bg-surface flex-shrink-0">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <span className="text-muted">{project?.name ?? '…'}</span>
          <span className="text-muted" aria-hidden>›</span>
          <span className="text-text font-semibold">{category?.name ?? '…'}</span>
          <span className="text-muted" aria-hidden>›</span>
          <span className="text-text font-semibold">Übersicht</span>
        </nav>
        <div className="flex gap-2.5 items-center">
          <Link
            to="/projects/$projectId/categories/$categoryId/settings"
            params={{ projectId, categoryId }}
            className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            ✎ Metadaten
          </Link>
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            className="py-2 px-3.5 rounded-lg text-sm font-semibold border border-accent bg-accent text-white hover:bg-[#4a6fef]"
          >
            → Workflow
          </Link>
        </div>
      </div>

      <DashboardCards
        category={category ?? null}
        stats={stats ?? null}
        projectId={projectId}
        categoryId={categoryId}
        isLoading={isLoading}
      />
    </div>
  )
}
