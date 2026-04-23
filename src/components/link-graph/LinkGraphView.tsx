import { useMemo } from 'react'
import { Background, BackgroundVariant, ReactFlow, MarkerType } from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { FilterSidebar } from './FilterSidebar'
import { HubNode } from './HubNode'
import { SpokeNode } from './SpokeNode'
import { BlogNode } from './BlogNode'
import { applyDagreLayout } from './graphLayout'
import { usePages } from '@/hooks/usePages'
import { usePageLinks } from '@/hooks/usePageLinks'

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
  const { data: pages = [], isLoading: pagesLoading } = usePages(projectId)
  const { data: pageLinks = [], isLoading: linksLoading } = usePageLinks(projectId)
  const isLoading = pagesLoading || linksLoading

  const { nodes, edges } = useMemo(() => {
    const rawNodes: Node[] = pages.map((page) => ({
      id: page.id,
      type: page.type,
      position: { x: page.position_x ?? 0, y: page.position_y ?? 0 },
      data: { label: page.name, status: page.status },
    }))

    const grouped = new Map<string, { source: string; target: string; links: typeof pageLinks }>()
    for (const link of pageLinks) {
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
      data: { linkCount: group.links.length, links: group.links },
    }))

    return { nodes: applyDagreLayout(rawNodes, rawEdges), edges: rawEdges }
  }, [pages, pageLinks])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-900">{projectName}</span>
          <span>/</span>
          <span>Link Graph</span>
        </div>
        <button
          disabled
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
        >
          Export
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        <FilterSidebar />

        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-400 text-sm">Lade Graph...</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            </ReactFlow>
          )}

          {!isLoading && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Noch keine Seiten vorhanden</p>
                <p className="text-slate-300 text-xs mt-1">
                  Seiten über "Seite anlegen" hinzufügen (SP23)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
