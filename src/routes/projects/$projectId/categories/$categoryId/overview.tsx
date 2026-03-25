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
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      {/* Topbar: wie Artefakte-Seite – Buttons + Breadcrumb */}
      <div className="flex flex-col border-b border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-start gap-2 px-6 py-3">
          <span className="py-2 px-4 rounded-lg text-sm font-semibold bg-slate-100 text-slate-900">
            📊 Übersicht
          </span>
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            search={{ open: 'templates' }}
            className="py-2 px-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            📚 Templates
          </Link>
          <Link
            to="/projects/$projectId/categories/$categoryId/settings"
            params={{ projectId, categoryId }}
            className="py-2 px-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            ✎ Metadaten
          </Link>
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            search={{ open: undefined }}
            className="py-2 px-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            ⬇ Export
          </Link>
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            search={{ open: undefined }}
            className="py-2 px-4 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            ＋ Artefakt
          </Link>
        </div>
        <nav className="flex items-center gap-2 px-6 pb-3 text-sm text-slate-500" aria-label="Breadcrumb">
          <span>{project?.name ?? 'Aktuelles Projekt'}</span>
          {parentCategory && (
            <>
              <span aria-hidden>›</span>
              <Link
                to="/projects/$projectId/categories/$categoryId"
                params={{ projectId, categoryId: parentCategory.id }}
                search={{ open: undefined }}
                className="text-slate-600 hover:text-slate-900 hover:underline"
              >
                {parentCategory.name}
              </Link>
            </>
          )}
          <span aria-hidden>›</span>
          <span className="text-slate-900 font-semibold">{category?.name ?? '…'}</span>
          <span aria-hidden>›</span>
          <span className="text-slate-600">Übersicht</span>
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
