import { createFileRoute, Link } from '@tanstack/react-router'
import { useProject } from '@/hooks/useProject'
import { useCategory } from '@/hooks/useCategory'
import { CategorySettingsTabs } from '@/components/CategorySettingsTabs'

export const Route = createFileRoute('/projects/$projectId/categories/$categoryId/settings')({
  component: CategorySettingsPage,
})

function CategorySettingsPage() {
  const { projectId, categoryId } = Route.useParams()
  const { data: project } = useProject(projectId)
  const { data: category } = useCategory(categoryId)

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg">
      <div className="flex items-center justify-between h-16 px-7 border-b border-border bg-surface flex-shrink-0">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            className="text-muted hover:text-text"
          >
            {project?.name ?? '…'}
          </Link>
          <span className="text-muted" aria-hidden>›</span>
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            className="text-muted hover:text-text"
          >
            {category?.name ?? '…'}
          </Link>
          <span className="text-muted" aria-hidden>›</span>
          <span className="text-text font-semibold">Einstellungen</span>
        </nav>
        <Link
          to="/projects/$projectId/categories/$categoryId/overview"
          params={{ projectId, categoryId }}
          className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
        >
          📊 Übersicht
        </Link>
        <Link
          to="/projects/$projectId/categories/$categoryId"
          params={{ projectId, categoryId }}
          className="py-2 px-3.5 rounded-lg text-sm font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text"
        >
          ← Zum Workflow
        </Link>
      </div>

      <CategorySettingsTabs category={category ?? null} projectId={projectId} />
    </div>
  )
}
