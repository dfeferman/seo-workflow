import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { useProjects } from '@/hooks/useProjects'
import { useAllCategories, buildCategoryTree } from '@/hooks/useCategories'
import { useCategoryProgress } from '@/hooks/useCategoryProgress'
import { useDeleteCategory } from '@/hooks/useDeleteCategory'
import { CreateCategoryModal } from '@/components/CreateCategoryModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { UserMenu } from '@/components/UserMenu'
import { SidebarProjectsSkeleton, SidebarCategoriesSkeleton } from '@/components/LoadingSkeleton'
import { EmptyState } from '@/components/EmptyState'
import type { CategoryRow, ProjectRow } from '@/types/database.types'

export function ProjectSidebar() {
  const params = useParams({ strict: false }) as { projectId?: string; categoryId?: string }
  const projectId = params.projectId ?? null
  const categoryId = params.categoryId ?? null
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [createModal, setCreateModal] = useState<{ projectId: string; projectName: string } | null>(null)

  const { data: projects = [], isLoading } = useProjects()

  // Beim Navigieren Projekt automatisch aufklappen
  useEffect(() => {
    if (projectId && projects.some((p) => p.id === projectId)) {
      setExpandedProjectId((prev) => (prev === projectId ? prev : projectId))
    }
  }, [projectId, projects])

  const toggleProject = (id: string) => {
    setExpandedProjectId((prev) => (prev === id ? null : id))
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <div className="px-3 pb-2 pt-0">
          <div className="text-2xs text-slate-500 uppercase tracking-wider font-semibold px-2 mb-2">
            Projekte
          </div>

          {isLoading ? (
            <SidebarProjectsSkeleton count={4} />
          ) : projects.length === 0 ? (
            <EmptyState
              icon="🗂"
              title="Keine Projekte"
              description="Lege ein neues Projekt an, um zu starten."
            />
          ) : (
            <div className="space-y-0">
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isExpanded={expandedProjectId === project.id}
                  onToggle={() => toggleProject(project.id)}
                  currentProjectId={projectId}
                  currentCategoryId={categoryId}
                  onOpenCreateCategory={() => setCreateModal({ projectId: project.id, projectName: project.name })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex-shrink-0 px-4 pb-4 space-y-2">
        <button
          type="button"
          className="w-full px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
          aria-label="Neues Projekt anlegen"
        >
          ＋ Neues Projekt
        </button>
        <UserMenu />
      </div>

      {createModal && (
        <CreateCategoryModal
          open={true}
          onClose={() => setCreateModal(null)}
          projectId={createModal.projectId}
          projectName={createModal.projectName}
        />
      )}
    </>
  )
}

type DeleteConfirmState = { id: string; name: string; hasChildren: boolean } | null

type ProjectRowProps = {
  project: ProjectRow
  isExpanded: boolean
  onToggle: () => void
  currentProjectId: string | null
  currentCategoryId: string | null
  onOpenCreateCategory: () => void
}

function ProjectRow({
  project,
  isExpanded,
  onToggle,
  currentProjectId,
  currentCategoryId,
  onOpenCreateCategory,
}: ProjectRowProps) {
  const navigate = useNavigate()
  const isActive = currentProjectId === project.id
  const { data: allCategories = [], isLoading } = useAllCategories(project.id)
  const tree = useMemo(() => buildCategoryTree(allCategories), [allCategories])
  const categoryTree = tree.filter((n) => n.type === 'category')
  const blogRoots = tree.filter((n) => n.type === 'blog')
  const deleteCategory = useDeleteCategory(project.id)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null)

  const progressCategoryIds = useMemo(() => {
    const ids: string[] = []
    for (const node of tree) {
      if (node.children.length > 0) ids.push(...node.children.map((c) => c.id))
      else ids.push(node.id)
    }
    return ids
  }, [tree])
  const progress = useCategoryProgress(project.id, progressCategoryIds)

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return
    const id = deleteConfirm.id
    deleteCategory.mutate(id, {
      onSuccess: () => {
        if (currentCategoryId === id) navigate({ to: '/' })
        setDeleteConfirm(null)
      },
    })
  }

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full py-2 px-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-colors text-left ${
          isActive
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
        aria-expanded={isExpanded}
      >
        <span className="text-sm flex-shrink-0" aria-hidden>
          🗂
        </span>
        <span className="flex-1 min-w-0 truncate">{project.name}</span>
        <span
          className={`w-5 h-5 flex items-center justify-center rounded text-slate-500 flex-shrink-0 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
          aria-hidden
        >
          ▶
        </span>
      </button>

      {isExpanded && (
        <div className="ml-2 border-l-2 border-slate-100 pl-2 mt-1.5 space-y-3">
          {isLoading ? (
            <SidebarCategoriesSkeleton count={4} />
          ) : (
            <>
              {categoryTree.length > 0 && (
                <CategoryTreeSection
                  title="Kategorien"
                  icon="🏷️"
                  nodes={categoryTree}
                  projectId={project.id}
                  progress={progress}
                  currentCategoryId={currentCategoryId}
                  onDeleteCategory={(cat) => setDeleteConfirm(cat)}
                />
              )}
              {blogRoots.length > 0 && (
                <Section
                  title="Blog"
                  icon="📝"
                  items={blogRoots.map((n) => ({ id: n.id, name: n.name }))}
                  projectId={project.id}
                  progress={progress}
                  currentCategoryId={currentCategoryId}
                  onDeleteCategory={(cat) => setDeleteConfirm(cat)}
                />
              )}
              {tree.length === 0 && (
                <EmptyState
                  icon="🏷️"
                  title="Keine Kategorien"
                  description="Neue Kategorie anlegen, um Inhalte zu strukturieren."
                  className="py-6 px-2"
                />
              )}
              <button
                type="button"
                onClick={onOpenCreateCategory}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-sm text-slate-500 font-medium hover:text-slate-900 hover:bg-slate-100 transition-colors mt-1"
              >
                ＋ Neue Kategorie
              </button>
            </>
          )}
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          open={true}
          title="Kategorie löschen?"
          message={
            deleteConfirm.hasChildren
              ? `„${deleteConfirm.name}" und alle Unterkategorien sowie alle Artefakte und Ergebnisse unwiderruflich löschen?`
              : `„${deleteConfirm.name}" und alle zugehörigen Artefakte sowie Ergebnisse unwiderruflich löschen?`
          }
          confirmLabel="Löschen"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          isLoading={deleteCategory.isPending}
        />
      )}
    </div>
  )
}

/** Kategorie-Knoten mit children (von buildCategoryTree). */
type CategoryTreeNode = CategoryRow & { children: CategoryRow[] }

type CategoryTreeSectionProps = {
  title: string
  icon: string
  nodes: CategoryTreeNode[]
  projectId: string
  progress: Record<string, { done: number; total: number }>
  currentCategoryId: string | null
  onDeleteCategory: (cat: { id: string; name: string; hasChildren: boolean }) => void
}

function CategoryTreeSection({
  title,
  icon,
  nodes,
  projectId,
  progress,
  currentCategoryId,
  onDeleteCategory,
}: CategoryTreeSectionProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 py-1 px-2 text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        <span className="text-xs" aria-hidden>
          {icon}
        </span>
        {title}
      </div>
      {nodes.map((node) => {
        if (node.children.length > 0) {
          const hubDoneTotal = progress[node.id]
          const isHubActive = currentCategoryId === node.id
          return (
            <div key={node.id} className="mb-3">
              {/* Oberkategorie (Hub) – hebt sich klar ab */}
              <div
                className={`flex items-center gap-1.5 py-2 px-2.5 rounded-lg border-l-2 transition-colors group ${
                  isHubActive
                    ? 'border-slate-400 bg-slate-100 text-slate-900 font-semibold'
                    : 'border-slate-100 bg-slate-50 text-slate-900 hover:border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-base flex-shrink-0 opacity-80" aria-hidden>
                  📁
                </span>
                <Link
                  to="/projects/$projectId/categories/$categoryId"
                  params={{ projectId, categoryId: node.id }}
                  search={{ open: undefined }}
                  className="flex items-center justify-between flex-1 min-w-0"
                >
                  <span className="truncate min-w-0 text-sm font-semibold">{node.name}</span>
                  {hubDoneTotal != null && (
                    <span
                      className={`text-2xs font-mono font-medium flex-shrink-0 ml-2 px-1.5 py-0.5 rounded ${
                        isHubActive ? 'bg-slate-200 text-slate-700' : 'bg-white text-slate-500 border border-slate-100'
                      }`}
                    >
                      {hubDoneTotal.done}/{hubDoneTotal.total}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDeleteCategory({ id: node.id, name: node.name, hasChildren: true })
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0"
                  title="Kategorie und alle Unterkategorien löschen"
                  aria-label={`${node.name} löschen`}
                >
                  🗑
                </button>
              </div>
              {/* Unterkategorien – Tree-Einrückung mit vertikaler Linie */}
              <div className="ml-3 mt-0.5 border-l-2 border-slate-100 pl-2 space-y-0.5">
                {node.children.map((cat) => {
                  const { done = 0, total = 0 } = progress[cat.id] ?? {}
                  const isActive = currentCategoryId === cat.id
                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center gap-1 py-1 px-2 rounded-lg text-xs transition-colors group ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-medium'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="text-slate-500 flex-shrink-0" aria-hidden>
                        └
                      </span>
                      <Link
                        to="/projects/$projectId/categories/$categoryId"
                        params={{ projectId, categoryId: cat.id }}
                        search={{ open: undefined }}
                        className="flex items-center justify-between flex-1 min-w-0"
                      >
                        <span className="truncate min-w-0">{cat.name}</span>
                        <span
                          className={`text-2xs font-mono font-medium flex-shrink-0 ml-2 px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {done}/{total}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDeleteCategory({ id: cat.id, name: cat.name, hasChildren: false })
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:bg-red-100 hover:text-red-600 transition-opacity flex-shrink-0"
                        title="Unterkategorie löschen"
                        aria-label={`${cat.name} löschen`}
                      >
                        🗑
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
        const { done = 0, total = 0 } = progress[node.id] ?? {}
        const isActive = currentCategoryId === node.id
        return (
          <div
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-sm transition-colors mb-0.5 group ${
              isActive
                ? 'bg-slate-100 text-slate-900 font-medium'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Link
              to="/projects/$projectId/categories/$categoryId"
              params={{ projectId, categoryId: node.id }}
              search={{ open: undefined }}
              className="flex items-center justify-between flex-1 min-w-0"
            >
              <span className="truncate min-w-0">{node.name}</span>
              <span
                className={`text-2xs font-mono font-medium flex-shrink-0 ml-2 px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done}/{total}
              </span>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDeleteCategory({ id: node.id, name: node.name, hasChildren: false })
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:bg-red-100 hover:text-red-600 transition-opacity flex-shrink-0"
              title="Kategorie löschen"
              aria-label={`${node.name} löschen`}
            >
              🗑
            </button>
          </div>
        )
      })}
    </div>
  )
}

type SectionProps = {
  title: string
  icon: string
  items: { id: string; name: string }[]
  projectId: string
  progress: Record<string, { done: number; total: number }>
  currentCategoryId: string | null
  onDeleteCategory: (cat: { id: string; name: string; hasChildren: boolean }) => void
}

function Section({ title, icon, items, projectId, progress, currentCategoryId, onDeleteCategory }: SectionProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 py-1 px-2 text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        <span className="text-xs" aria-hidden>
          {icon}
        </span>
        {title}
      </div>
      {items.map((cat) => {
        const { done = 0, total = 0 } = progress[cat.id] ?? {}
        const isActive = currentCategoryId === cat.id
        return (
          <div
            key={cat.id}
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-sm transition-colors mb-0.5 group ${
              isActive
                ? 'bg-slate-100 text-slate-900 font-medium'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Link
              to="/projects/$projectId/categories/$categoryId"
              params={{ projectId, categoryId: cat.id }}
              search={{ open: undefined }}
              className="flex items-center justify-between flex-1 min-w-0"
            >
              <span className="truncate min-w-0">{cat.name}</span>
              <span
                className={`text-2xs font-mono font-medium flex-shrink-0 ml-2 px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done}/{total}
              </span>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDeleteCategory({ id: cat.id, name: cat.name, hasChildren: false })
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:bg-red-100 hover:text-red-600 transition-opacity flex-shrink-0"
              title="Kategorie löschen"
              aria-label={`${cat.name} löschen`}
            >
              🗑
            </button>
          </div>
        )
      })}
    </div>
  )
}
