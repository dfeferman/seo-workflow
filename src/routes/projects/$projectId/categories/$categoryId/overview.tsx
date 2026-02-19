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
  const { data: parentCategory } = useCategory(category?.parent_id ?? undefined)
  const { data: stats, isLoading } = useStats(categoryId)

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg">
      {/* Topbar: wie Artefakte-Seite – Buttons + Breadcrumb */}
      <div className="flex flex-col border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center justify-start gap-2 px-5 py-3">
          <span className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary">
            📊 Übersicht
          </span>
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            search={{ open: 'templates' }}
            className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            📚 Templates
          </Link>
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
            className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
          >
            ⬇ Export
          </Link>
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            className="py-2 px-3.5 rounded-lg text-sm font-semibold border border-accent bg-accent text-white hover:bg-[#4a6fef]"
          >
            ＋ Artefakt
          </Link>
        </div>
        <nav className="flex items-center gap-2 px-5 pb-3 text-sm text-muted" aria-label="Breadcrumb">
          <span>{project?.name ?? 'Aktuelles Projekt'}</span>
          {parentCategory && (
            <>
              <span aria-hidden>›</span>
              <Link
                to="/projects/$projectId/categories/$categoryId"
                params={{ projectId, categoryId: parentCategory.id }}
                className="text-text-secondary hover:text-text hover:underline"
              >
                {parentCategory.name}
              </Link>
            </>
          )}
          <span aria-hidden>›</span>
          <span className="text-text font-semibold">{category?.name ?? '…'}</span>
          <span aria-hidden>›</span>
          <span className="text-text-secondary">Übersicht</span>
        </nav>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <DashboardCards
          category={category ?? null}
          stats={stats ?? null}
          projectId={projectId}
          categoryId={categoryId}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
