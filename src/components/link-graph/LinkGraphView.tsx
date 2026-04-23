import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { FilterSidebar } from './FilterSidebar'

interface LinkGraphViewProps {
  projectName: string
}

export function LinkGraphView({ projectName }: LinkGraphViewProps) {
  // SP18 ersetzt diese leeren Arrays durch echte Daten aus usePages/usePageLinks.
  const nodes: [] = []
  const edges: [] = []

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
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Noch keine Seiten vorhanden</p>
                <p className="text-slate-300 text-xs mt-1">
                  Seiten werden in SP18 aus der Datenbank geladen
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
