import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { useProjects } from '@/hooks/useProjects'
import { useAllCategories, buildCategoryTree } from '@/hooks/useCategories'
import { useCategoryProgress } from '@/hooks/useCategoryProgress'
import { useDeleteCategory } from '@/hooks/useDeleteCategory'
import { CreateCategoryModal } from '@/components/CreateCategoryModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { UserMenu } from '@/components/UserMenu'
import type { CategoryRow } from '@/types/database.types'

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
          <div className="text-2xs text-muted uppercase tracking-wider font-semibold px-2 mb-2">
            Projekte
          </div>

          {isLoading ? (
            <p className="text-sm text-muted px-2">Laden…</p>
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

      <div className="mt-auto pt-4 border-t border-border flex-shrink-0 px-4 pb-4 space-y-2">
        <button
          type="button"
          className="w-full py-2.5 px-3.5 rounded-lg bg-accent text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#4a6fef] hover:shadow transition-all"
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
  project: { id: string; name: string }
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
        className={`w-full py-2 px-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all text-left ${
          isActive
            ? 'bg-accent-light text-accent'
            : 'text-text-secondary hover:bg-surface-2 hover:text-text'
        }`}
        aria-expanded={isExpanded}
      >
        <span className="text-sm flex-shrink-0" aria-hidden>
          🗂
        </span>
        <span className="flex-1 min-w-0 truncate">{project.name}</span>
        <span
          className={`w-5 h-5 flex items-center justify-center rounded text-muted flex-shrink-0 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
          aria-hidden
        >
          ▶
        </span>
      </button>

      {isExpanded && (
        <div className="ml-2 border-l-2 border-border pl-2 mt-1.5 space-y-3">
          {isLoading ? (
            <p className="text-2xs text-muted px-2">Kategorien laden…</p>
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
                <p className="text-2xs text-muted px-2">Keine Kategorien</p>
              )}
              <button
                type="button"
                onClick={onOpenCreateCategory}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-md text-sm text-accent font-medium hover:bg-accent-light/50 transition-colors mt-1"
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
      <div className="flex items-center gap-1.5 py-1 px-2 text-2xs font-semibold text-muted uppercase tracking-wide mb-1">
        <span className="text-xs" aria-hidden>
          {icon}
        </span>
        {title}
      </div>
      {nodes.map((node) => {
        if (node.children.length > 0) {
          return (
            <div key={node.id} className="mb-2">
              <div className="flex items-center justify-between gap-1 py-0.5 px-2.5 text-2xs font-medium text-muted group">
                <span className="truncate">{node.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDeleteCategory({ id: node.id, name: node.name, hasChildren: true })
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0"
                  title="Kategorie und alle Unterkategorien löschen"
                  aria-label={`${node.name} löschen`}
                >
                  🗑
                </button>
              </div>
              {node.children.map((cat) => {
                const { done = 0, total = 0 } = progress[cat.id] ?? {}
                const isActive = currentCategoryId === cat.id
                return (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-1 py-1.5 px-2.5 rounded-md text-sm transition-all mb-0.5 group ${
                      isActive
                        ? 'bg-accent-light text-accent font-medium'
                        : 'text-text-secondary hover:bg-surface-2 hover:text-text'
                    }`}
                  >
                    <Link
                      to="/projects/$projectId/categories/$categoryId"
                      params={{ projectId, categoryId: cat.id }}
                      className="flex items-center justify-between flex-1 min-w-0"
                    >
                      <span className="truncate min-w-0">{cat.name}</span>
                      <span
                        className={`text-2xs font-mono font-medium flex-shrink-0 ml-2 px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted'
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
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0"
                      title="Unterkategorie löschen"
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
        const { done = 0, total = 0 } = progress[node.id] ?? {}
        const isActive = currentCategoryId === node.id
        return (
          <div
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-md text-sm transition-all mb-0.5 group ${
              isActive
                ? 'bg-accent-light text-accent font-medium'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text'
            }`}
          >
            <Link
              to="/projects/$projectId/categories/$categoryId"
              params={{ projectId, categoryId: node.id }}
              className="flex items-center justify-between flex-1 min-w-0"
            >
              <span className="truncate min-w-0">{node.name}</span>
              <span
                className={`text-2xs font-mono font-medium flex-shrink-0 ml-2 px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted'
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
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0"
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
      <div className="flex items-center gap-1.5 py-1 px-2 text-2xs font-semibold text-muted uppercase tracking-wide mb-1">
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
            className={`flex items-center gap-1 py-1.5 px-2.5 rounded-md text-sm transition-all mb-0.5 group ${
              isActive
                ? 'bg-accent-light text-accent font-medium'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text'
            }`}
          >
            <Link
              to="/projects/$projectId/categories/$categoryId"
              params={{ projectId, categoryId: cat.id }}
              className="flex items-center justify-between flex-1 min-w-0"
            >
              <span className="truncate min-w-0">{cat.name}</span>
              <span
                className={`text-2xs font-mono font-medium flex-shrink-0 ml-2 px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted'
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
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted hover:bg-red-100 hover:text-red-600 transition-all flex-shrink-0"
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
