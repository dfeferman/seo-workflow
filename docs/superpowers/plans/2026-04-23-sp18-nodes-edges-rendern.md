# SP18 - Nodes & Edges rendern

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Link Graph mit echten Daten aus der Datenbank befuellen - Seiten als Custom Nodes (Hub/Spoke/Blog), interne Links als gerichtete Edges mit variabler Liniendicke, automatisch layoutet via Dagre.

**Architecture:** Die TanStack-Query-Hooks `usePages` und `usePageLinks` fetchen Rohdaten ueber `apiClient`. Eine Hilfsfunktion `applyDagreLayout` berechnet Positionen fuer Nodes ohne persistierte Koordinaten. `LinkGraphView` transformiert DB-Rows in React-Flow-Nodes/Edges, aggregiert Link-Instanzen fuer die visuelle Staerke, behaelt aber die zugrunde liegenden Link-Instanzen an der Edge fuer SP20.

**Tech Stack:** React 18 + TypeScript, TanStack Query v5, `@xyflow/react` v12, `@dagrejs/dagre`, Tailwind CSS

---

## Datei-Uebersicht

| Aktion | Pfad | Zweck |
|--------|------|-------|
| Create | `src/hooks/usePages.ts` | TanStack Query Hook fuer `pages` |
| Create | `src/hooks/usePageLinks.ts` | TanStack Query Hook fuer `page_links` |
| Create | `src/components/link-graph/graphLayout.ts` | Dagre-Layout-Hilfsfunktion |
| Create | `src/components/link-graph/HubNode.tsx` | Custom Node: Hub |
| Create | `src/components/link-graph/SpokeNode.tsx` | Custom Node: Spoke |
| Create | `src/components/link-graph/BlogNode.tsx` | Custom Node: Blog |
| Modify | `src/components/link-graph/LinkGraphView.tsx` | Echte Daten + nodeTypes einbinden |
| Modify | `src/routes/projects/$projectId/link-graph.tsx` | `projectId` an `LinkGraphView` weitergeben |
| Modify | `docs/ROADMAP_LinkGraph.md` | SP18 Log + Status |

---

## Task 1: usePages Hook

**Files:**
- Create: `src/hooks/usePages.ts`

- [ ] **Step 1: Datei erstellen**

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PageRow } from '@/types/database.types'

export function usePages(projectId: string | undefined) {
  return useQuery({
    queryKey: ['pages', projectId],
    queryFn: async (): Promise<PageRow[]> => {
      if (!projectId) return []
      return apiClient.pages.getByProject(projectId)
    },
    enabled: !!projectId,
  })
}
```

---

## Task 2: usePageLinks Hook

**Files:**
- Create: `src/hooks/usePageLinks.ts`

- [ ] **Step 2: Datei erstellen**

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PageLinkRow } from '@/types/database.types'

export function usePageLinks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['page-links', projectId],
    queryFn: async (): Promise<PageLinkRow[]> => {
      if (!projectId) return []
      return apiClient.pageLinks.getByProject(projectId)
    },
    enabled: !!projectId,
  })
}
```

---

## Task 3: Dagre Layout Hilfsfunktion

**Files:**
- Create: `src/components/link-graph/graphLayout.ts`

Ziel: Persistierte Node-Positionen aus der DB respektieren. Dagre wird nur als Fallback fuer Nodes ohne `position_x`/`position_y` verwendet.

- [ ] **Step 3: Datei erstellen**

```typescript
import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'

const NODE_SIZE: Record<string, number> = {
  hub: 60,
  spoke: 50,
  blog: 50,
}

export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes

  const hasPersistedPositions = nodes.some(
    (node) => typeof node.position?.x === 'number' && typeof node.position?.y === 'number'
  )

  if (hasPersistedPositions) {
    return nodes
  }

  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    const size = NODE_SIZE[node.type ?? 'spoke'] ?? 50
    graph.setNode(node.id, { width: size, height: size })
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const size = NODE_SIZE[node.type ?? 'spoke'] ?? 50
    const pos = graph.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - size / 2,
        y: pos.y - size / 2,
      },
    }
  })
}
```

Hinweis: SP18 entscheidet explizit: Persistierte Positionen gewinnen vor Auto-Layout. Falls spaeter ein "Layout neu berechnen"-Button kommt, wird das separat eingefuehrt.

---

## Task 4: Custom Node Komponenten

**Files:**
- Create: `src/components/link-graph/HubNode.tsx`
- Create: `src/components/link-graph/SpokeNode.tsx`
- Create: `src/components/link-graph/BlogNode.tsx`

Ziel: Knoten bleiben visuell kompakt; Labels werden ausserhalb der Kreisflaeche gerendert, damit Seitennamen lesbar bleiben.

- [ ] **Step 4: `HubNode.tsx` erstellen**

```tsx
import { Handle, Position } from '@xyflow/react'
import type { PageStatus } from '@/types/database.types'

interface HubNodeData {
  label: string
  status: PageStatus
}

export function HubNode({ data }: { data: HubNodeData }) {
  const isDashed = data.status === 'planned'

  return (
    <div className="flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div
        className={[
          'rounded-full bg-blue-100 border-2 border-blue-500',
          isDashed ? 'border-dashed' : '',
        ].join(' ')}
        style={{ width: 60, height: 60 }}
      />
      <div className="mt-2 max-w-28 text-center text-xs font-semibold leading-tight text-slate-700">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </div>
  )
}
```

- [ ] **Step 5: `SpokeNode.tsx` erstellen**

```tsx
import { Handle, Position } from '@xyflow/react'
import type { PageStatus } from '@/types/database.types'

interface SpokeNodeData {
  label: string
  status: PageStatus
}

export function SpokeNode({ data }: { data: SpokeNodeData }) {
  const isDashed = data.status === 'planned'

  return (
    <div className="flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!bg-green-400" />
      <div
        className={[
          'rounded-full bg-green-100 border-2 border-green-500',
          isDashed ? 'border-dashed' : '',
        ].join(' ')}
        style={{ width: 50, height: 50 }}
      />
      <div className="mt-2 max-w-28 text-center text-xs font-semibold leading-tight text-slate-700">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-400" />
    </div>
  )
}
```

- [ ] **Step 6: `BlogNode.tsx` erstellen**

```tsx
import { Handle, Position } from '@xyflow/react'
import type { PageStatus } from '@/types/database.types'

interface BlogNodeData {
  label: string
  status: PageStatus
}

export function BlogNode({ data }: { data: BlogNodeData }) {
  const isDashed = data.status === 'planned'

  return (
    <div className="flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!bg-yellow-400" />
      <div
        className={[
          'rounded-full bg-yellow-100 border-2 border-yellow-500',
          isDashed ? 'border-dashed' : '',
        ].join(' ')}
        style={{ width: 50, height: 50 }}
      />
      <div className="mt-2 max-w-28 text-center text-xs font-semibold leading-tight text-slate-700">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-400" />
    </div>
  )
}
```

---

## Task 5: Route - `projectId` weitergeben

**Files:**
- Modify: `src/routes/projects/$projectId/link-graph.tsx`

- [ ] **Step 7: Route anpassen**

Passe nur den Return-Ausdruck an, statt die Datei komplett zu ersetzen:

```tsx
return <LinkGraphView projectId={projectId} projectName={project?.name ?? '...'} />
```

Hinweis: Keine Vollersetzung der Route-Datei, damit SP17-Aenderungen nicht versehentlich verloren gehen.

---

## Task 6: LinkGraphView mit echten Daten

**Files:**
- Modify: `src/components/link-graph/LinkGraphView.tsx`

Ziel: Bestehende SP17-Komponente erweitern statt komplett zu ersetzen.

- [ ] **Step 8: Imports ergaenzen**

Ergaenze in `LinkGraphView.tsx`:

```tsx
import { useMemo } from 'react'
import { MarkerType } from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'
import { HubNode } from './HubNode'
import { SpokeNode } from './SpokeNode'
import { BlogNode } from './BlogNode'
import { applyDagreLayout } from './graphLayout'
import { usePages } from '@/hooks/usePages'
import { usePageLinks } from '@/hooks/usePageLinks'
```

- [ ] **Step 9: Props und nodeTypes erweitern**

Ersetze das Props-Interface durch:

```tsx
interface LinkGraphViewProps {
  projectId: string
  projectName: string
}

const nodeTypes = {
  hub: HubNode,
  spoke: SpokeNode,
  blog: BlogNode,
}
```

- [ ] **Step 10: Daten laden und transformieren**

Ersetze die Platzhalter-Arrays durch:

```tsx
const { data: pages = [], isLoading: pagesLoading } = usePages(projectId)
const { data: pageLinks = [], isLoading: linksLoading } = usePageLinks(projectId)
const isLoading = pagesLoading || linksLoading

const { nodes, edges } = useMemo(() => {
  const rawNodes: Node[] = pages.map((page) => ({
    id: page.id,
    type: page.type,
    position: {
      x: page.position_x ?? 0,
      y: page.position_y ?? 0,
    },
    data: {
      label: page.name,
      status: page.status,
    },
  }))

  const grouped = new Map<
    string,
    {
      source: string
      target: string
      links: typeof pageLinks
    }
  >()

  for (const link of pageLinks) {
    const key = `${link.from_page_id}__${link.to_page_id}`
    const current = grouped.get(key)
    if (current) {
      current.links.push(link)
    } else {
      grouped.set(key, {
        source: link.from_page_id,
        target: link.to_page_id,
        links: [link],
      })
    }
  }

  const rawEdges: Edge[] = [...grouped.entries()].map(([key, group]) => ({
    id: key,
    source: group.source,
    target: group.target,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    style: {
      stroke: '#94a3b8',
      strokeWidth: Math.min(1 + group.links.length, 6),
    },
    data: {
      linkCount: group.links.length,
      links: group.links,
    },
  }))

  return {
    nodes: applyDagreLayout(rawNodes, rawEdges),
    edges: rawEdges,
  }
}, [pages, pageLinks])
```

Hinweis: `edge.data.links` ist in SP18 schon absichtlich da, damit SP20 beim Edge-Klick auf Anchor-/Kontext-/Zeileninformationen zugreifen kann, ohne das Modell nochmal umzubauen.

- [ ] **Step 11: ReactFlow-Block erweitern**

Passe den bestehenden Render-Block an:

```tsx
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
```

Den Empty-State-Block so anpassen:

```tsx
{!isLoading && nodes.length === 0 && (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="text-center">
      <p className="text-slate-400 text-sm font-medium">Noch keine Seiten vorhanden</p>
      <p className="text-slate-300 text-xs mt-1">
        Seiten ueber "Seite anlegen" hinzufuegen (SP23)
      </p>
    </div>
  </div>
)}
```

---

## Task 7: Integrierte Verifikation

- [ ] **Step 12: Gesamt-Build pruefen**

```bash
npm run build
```

Erwartetes Ergebnis: Build gruen, keine TS-Fehler.

- [ ] **Step 13: Laufzeit pruefen**

1. `npm run dev`
2. `npm run server:dev`
3. Browser: `http://localhost:5173/projects/<uuid>/link-graph`

Erwartetes Verhalten:

- bei leerer DB: Empty State
- bei vorhandenen `pages`: passende Nodes in drei Typen
- bei vorhandenen `page_links`: gerichtete Edges mit variabler Dicke
- keine React- oder Router-Fehler in Konsole

- [ ] **Step 14: Optionale Testdaten**

```sql
INSERT INTO pages (project_id, name, type, status)
VALUES
  ('<project-uuid>', 'Hauptseite', 'hub', 'published'),
  ('<project-uuid>', 'Unterseite A', 'spoke', 'draft'),
  ('<project-uuid>', 'Blog Post 1', 'blog', 'planned');
```

Erwartung:

- `hub` blau, 60px
- `spoke` gruen, 50px
- `blog` gelb und bei `planned` gestrichelt

---

## Task 8: Roadmap aktualisieren

**Files:**
- Modify: `docs/ROADMAP_LinkGraph.md`

- [ ] **Step 15: SP18 Status und Log aktualisieren**

In `docs/ROADMAP_LinkGraph.md` den SP18-Block anpassen:

```markdown
## SP18 - Nodes & Edges rendern

**Geschaetzte Dauer:** ~4h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP17

**Deliverables:**
- `src/hooks/usePages.ts`
- `src/hooks/usePageLinks.ts`
- Custom Node-Komponenten: `HubNode.tsx`, `SpokeNode.tsx`, `BlogNode.tsx`
- `src/components/link-graph/graphLayout.ts` - Dagre Auto-Layout
- Edges mit Staerke aus aggregierten Link-Instanzen

**Log:**
- 2026-04-23 - gestartet
- 2026-04-23 - Hooks, Node-Komponenten, Layout, Rendering abgeschlossen
- 2026-04-23 - abgeschlossen
```

Und in der Gesamt-Tabelle SP18 auf `[x]` setzen.

---

## Task 9: Commit

- [ ] **Step 16: Einen integrierten Commit erstellen**

Erst committen, wenn der Gesamtzustand gruen ist:

```bash
git add src/hooks/usePages.ts src/hooks/usePageLinks.ts src/components/link-graph/graphLayout.ts src/components/link-graph/HubNode.tsx src/components/link-graph/SpokeNode.tsx src/components/link-graph/BlogNode.tsx src/components/link-graph/LinkGraphView.tsx src/routes/projects/$projectId/link-graph.tsx docs/ROADMAP_LinkGraph.md
git commit -m "feat(sp18): Link Graph mit echten Nodes, Edges und Dagre-Layout"
```

Keine Zwischen-Commits fuer halbfertige Teilstaende.

---

## Self-Review Checklist

- [x] **Spec-Abdeckung:** `usePages`, `usePageLinks`, Custom Nodes, Dagre-Layout, gerichtete Edges mit aggregierter Staerke
- [x] **SP20-vorbereitet:** Aggregierte Edges behalten die zugrunde liegenden Link-Instanzen in `edge.data.links`
- [x] **Layout-Entscheidung klar:** Persistierte Positionen gewinnen vor Dagre-Fallback
- [x] **UI-lesbar:** Label ausserhalb des Kreises statt in 50px/60px Nodes gequetscht
- [x] **Keine Vollersetzung ohne Not:** Route und View werden erweitert, nicht blind komplett ueberschrieben
- [x] **Commit-Grenze sinnvoll:** Ein integrierter gruener Commit statt vieler Teil-Commits
