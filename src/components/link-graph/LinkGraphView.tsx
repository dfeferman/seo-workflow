import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Background, BackgroundVariant, ReactFlow, MarkerType } from '@xyflow/react'
import type { Edge, Node, EdgeMouseHandler, NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { FilterSidebar } from './FilterSidebar'
import { HubNode } from './HubNode'
import { SpokeNode } from './SpokeNode'
import { BlogNode } from './BlogNode'
import { applyDagreLayout } from './graphLayout'
import { usePages } from '@/hooks/usePages'
import { usePageLinks } from '@/hooks/usePageLinks'
import { useProjectCategoryPhases } from '@/hooks/useProjectCategoryPhases'
import { NodeDetailsPanel } from './NodeDetailsPanel'
import { EdgeDetailsPopup } from './EdgeDetailsPopup'
import { LinkGraphFitView } from './LinkGraphFitView'
import { apiClient } from '@/lib/apiClient'
import type { PageLinkRow } from '@/types/database.types'
import { defaultLinkGraphFilters, filterPagesForGraph } from './linkGraphFilter'
import type { LinkGraphFilters } from './linkGraphFilter'

const nodeTypes = {
  hub: HubNode,
  spoke: SpokeNode,
  blog: BlogNode,
}

interface LinkGraphViewProps {
  projectId: string
  projectName: string
}

export function LinkGraphView({ projectId, projectName }: LinkGraphViewProps) {
  const queryClient = useQueryClient()
  const { data: pages = [], isLoading: pagesLoading } = usePages(projectId)
  const { data: pageLinks = [], isLoading: linksLoading } = usePageLinks(projectId)
  const { data: categoryPhases = new Map<string, Set<string>>(), isLoading: phasesLoading } =
    useProjectCategoryPhases(projectId)

  const [filters, setFilters] = useState<LinkGraphFilters>(() => defaultLinkGraphFilters())
  const [searchInput, setSearchInput] = useState('')
  const [searchMatchIds, setSearchMatchIds] = useState<Set<string> | null>(null)
  const [fitRequest, setFitRequest] = useState<{ nodeIds: string[]; nonce: number } | null>(null)
  const [dragDepth, setDragDepth] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const importMutation = useMutation({
    mutationFn: (file: File) => apiClient.pages.importMarkdown(projectId, file),
    onSuccess: async () => {
      setUploadError(null)
      await queryClient.invalidateQueries({ queryKey: ['pages', projectId] })
      await queryClient.invalidateQueries({ queryKey: ['page-links', projectId] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Upload fehlgeschlagen'
      setUploadError(msg)
    },
  })

  const handleFilterChange = useCallback((next: LinkGraphFilters) => {
    setFilters(next)
    setSearchMatchIds(null)
    setFitRequest(null)
  }, [])

  const phaseFilterActive = filters.phases.length > 0
  const isLoading = pagesLoading || linksLoading || (phaseFilterActive && phasesLoading)

  const visiblePages = useMemo(
    () => filterPagesForGraph(pages, pageLinks, filters, categoryPhases),
    [pages, pageLinks, filters, categoryPhases]
  )

  const visibleIds = useMemo(() => new Set(visiblePages.map((p) => p.id)), [visiblePages])

  const filteredLinks = useMemo(
    () => pageLinks.filter((l) => visibleIds.has(l.from_page_id) && visibleIds.has(l.to_page_id)),
    [pageLinks, visibleIds]
  )

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? null

  const runSearch = useCallback(() => {
    const q = searchInput.trim().toLowerCase()
    if (!q) {
      setSearchMatchIds(null)
      setFitRequest(null)
      return
    }
    const ids = visiblePages.filter((p) => p.name.toLowerCase().includes(q)).map((p) => p.id)
    if (ids.length === 0) {
      setSearchMatchIds(null)
      setFitRequest(null)
      return
    }
    setSearchMatchIds(new Set(ids))
    setFitRequest({ nodeIds: ids, nonce: Date.now() })
  }, [searchInput, visiblePages])

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedEdgeId(null)
    setSelectedPageId(node.id)
  }

  const handleEdgeClick: EdgeMouseHandler = (_event, edge) => {
    setSelectedPageId(null)
    setSelectedEdgeId(edge.id)
  }

  const handlePaneClick = () => {
    setSelectedPageId(null)
    setSelectedEdgeId(null)
  }

  const { nodes, edges } = useMemo(() => {
    const searchActive = searchMatchIds != null && searchMatchIds.size > 0

    const rawNodes: Node[] = visiblePages.map((page) => ({
      id: page.id,
      type: page.type,
      position: { x: page.position_x ?? 0, y: page.position_y ?? 0 },
      data: {
        label: page.name,
        status: page.status,
        dimmed: searchActive && !searchMatchIds!.has(page.id),
        searchMatch: searchActive && searchMatchIds!.has(page.id),
      },
    }))

    const grouped = new Map<string, { source: string; target: string; links: PageLinkRow[] }>()
    for (const link of filteredLinks) {
      const key = `${link.from_page_id}__${link.to_page_id}`
      const current = grouped.get(key)
      if (current) {
        current.links.push(link)
      } else {
        grouped.set(key, { source: link.from_page_id, target: link.to_page_id, links: [link] })
      }
    }

    const rawEdges: Edge[] = [...grouped.entries()].map(([key, group]) => ({
      id: key,
      source: group.source,
      target: group.target,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      style: { stroke: '#94a3b8', strokeWidth: Math.min(1 + group.links.length, 6) },
      interactionWidth: 20,
      data: { linkCount: group.links.length, links: group.links },
    }))

    return { nodes: applyDagreLayout(rawNodes, rawEdges), edges: rawEdges }
  }, [visiblePages, filteredLinks, searchMatchIds])

  useEffect(() => {
    if (selectedPageId && !visibleIds.has(selectedPageId)) {
      setSelectedPageId(null)
    }
  }, [visibleIds, selectedPageId])

  useEffect(() => {
    if (!selectedEdgeId) return
    const edge = edges.find((e) => e.id === selectedEdgeId)
    if (!edge || !visibleIds.has(edge.source) || !visibleIds.has(edge.target)) {
      setSelectedEdgeId(null)
    }
  }, [edges, visibleIds, selectedEdgeId])

  const selectedEdgeBundle = useMemo(() => {
    if (!selectedEdgeId) return null
    const edge = edges.find((e) => e.id === selectedEdgeId)
    if (!edge?.data || typeof edge.data !== 'object' || !('links' in edge.data)) return null
    const links = (edge.data as { links: PageLinkRow[] }).links
    const fromPage = pages.find((p) => p.id === edge.source)
    const toPage = pages.find((p) => p.id === edge.target)
    if (!fromPage || !toPage || links.length === 0) return null
    return { fromPage, toPage, links }
  }, [selectedEdgeId, edges, pages])

  const showFilteredEmpty = !isLoading && pages.length > 0 && visiblePages.length === 0

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragDepth((d) => d + 1)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragDepth((d) => Math.max(0, d - 1))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragDepth(0)
      const files = e.dataTransfer.files
      if (!files?.length) return
      const file = files[0]
      if (!file.name.toLowerCase().endsWith('.md')) {
        setUploadError('Nur .md-Dateien werden unterstützt.')
        return
      }
      importMutation.mutate(file)
    },
    [importMutation]
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
          <span className="font-medium text-slate-900 truncate">{projectName}</span>
          <span>/</span>
          <span className="flex-shrink-0">Link Graph</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Knoten suchen…"
              className="w-44 sm:w-56 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="Knoten im Graph suchen"
            />
            <button
              type="button"
              onClick={runSearch}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              Suchen
            </button>
          </div>
          <button
            disabled
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
          >
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <FilterSidebar filters={filters} onChange={handleFilterChange} />

        <div
          className="flex-1 relative outline-none"
          role="presentation"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {importMutation.isPending && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 pointer-events-none">
              <p className="text-sm font-medium text-slate-600">Markdown wird importiert …</p>
            </div>
          )}
          {dragDepth > 0 && !importMutation.isPending && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-sky-500/10 border-2 border-dashed border-sky-400 rounded-none pointer-events-none">
              <p className="text-sm font-medium text-sky-700">Markdown-Datei hier ablegen</p>
            </div>
          )}
          {uploadError && (
            <div className="absolute top-2 left-2 right-2 z-30 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-800">
              {uploadError}
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => setUploadError(null)}
              >
                Schließen
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-400 text-sm">Lade Graph...</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPaneClick={handlePaneClick}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <LinkGraphFitView request={fitRequest} />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            </ReactFlow>
          )}

          {!isLoading && pages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Noch keine Seiten vorhanden</p>
                <p className="text-slate-300 text-xs mt-1">
                  Markdown hierher ziehen (.md) oder Seiten später über „Seite anlegen“ (SP23)
                </p>
              </div>
            </div>
          )}

          {showFilteredEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-sm px-4">
                <p className="text-slate-500 text-sm font-medium">Keine Seiten für aktuelle Filter</p>
                <p className="text-slate-400 text-xs mt-1">
                  Filter in der Sidebar lockern oder Phasen-Daten noch laden.
                </p>
              </div>
            </div>
          )}

          {selectedPage && visibleIds.has(selectedPage.id) && (
            <NodeDetailsPanel
              page={selectedPage}
              pages={pages}
              pageLinks={pageLinks}
              onClose={() => setSelectedPageId(null)}
            />
          )}

          {selectedEdgeBundle && (
            <EdgeDetailsPopup
              open={true}
              onClose={() => setSelectedEdgeId(null)}
              fromPage={selectedEdgeBundle.fromPage}
              toPage={selectedEdgeBundle.toPage}
              links={selectedEdgeBundle.links}
            />
          )}
        </div>
      </div>
    </div>
  )
}
