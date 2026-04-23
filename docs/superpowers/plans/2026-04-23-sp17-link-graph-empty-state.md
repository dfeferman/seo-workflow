# SP17: Leere Graph-View - Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React-Flow-Graph-View unter `/projects/$projectId/link-graph` aufbauen - mit GET-only-Backend fuer leeren Datenzugriff, apiClient-Stubs, leerem Canvas und nicht-funktionaler Filter-Sidebar.

**Architecture:** SP17 bleibt bewusst beim Empty State. Backend-seitig werden nur die fuer SP18 benoetigten Lese-Endpunkte vorbereitet. Frontend-seitig entsteht eine TanStack Router File-Route `link-graph.tsx`, die `LinkGraphView` rendert. `LinkGraphView` zeigt einen Empty State, solange keine Nodes vorhanden sind. `FilterSidebar` ist rein visuell - kein State, keine Logik, keine Mutationen.

**Tech Stack:** Express 5, pg.Pool, React 18, TypeScript, TanStack Router v1, `@xyflow/react` v12, Tailwind CSS

---

## File Map

| Aktion | Pfad | Zweck |
|--------|------|-------|
| Install | npm packages | `@xyflow/react`, `@dagrejs/dagre` |
| Erstellen | `server/routes/pages.ts` | GET-Routen fuer `pages` |
| Erstellen | `server/routes/pageLinks.ts` | GET-Routen fuer `page_links` |
| Modifizieren | `server/index.ts` | Neue Router registrieren |
| Modifizieren | `src/lib/apiClient.ts` | `pages.getByProject/getById` und `pageLinks.getByProject` ergaenzen |
| Erstellen | `src/components/link-graph/FilterSidebar.tsx` | Linke Sidebar (Struktur, kein State) |
| Erstellen | `src/components/link-graph/LinkGraphView.tsx` | Graph-Canvas mit Empty State |
| Erstellen | `src/routes/projects/$projectId/link-graph.tsx` | TanStack Router Route |
| Modifizieren | `docs/ROADMAP_LinkGraph.md` | SP17 Log + Status |

---

## Task 1: Libraries installieren

- [ ] **Step 1: Packages installieren**

```bash
npm install @xyflow/react @dagrejs/dagre
```

Erwartetes Ergebnis: Kein Fehler. `@xyflow/react` und `@dagrejs/dagre` erscheinen in `package.json` unter `dependencies`.

- [ ] **Step 2: Build pruefen**

```bash
npm run build
```

Erwartetes Ergebnis: Build gruen.

---

## Task 2: Express-Router fuer `pages` (GET-only)

**Files:**
- Create: `server/routes/pages.ts`

- [ ] **Step 3: `server/routes/pages.ts` erstellen**

```typescript
import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

async function pageBelongsToUser(pageId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM pages pg
     JOIN projects p ON p.id = pg.project_id
     WHERE pg.id = $1 AND p.user_id = $2`,
    [pageId, userId]
  )
  return (r.rowCount ?? 0) > 0
}

// GET /api/pages/by-project/:projectId
router.get('/by-project/:projectId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT pg.* FROM pages pg
     JOIN projects p ON p.id = pg.project_id
     WHERE pg.project_id = $1 AND p.user_id = $2
     ORDER BY pg.created_at ASC`,
    [routeParamOne(req.params.projectId), req.userId]
  )
  res.json(result.rows)
})

// GET /api/pages/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await pageBelongsToUser(id, req.userId!))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const result = await pool.query(`SELECT * FROM pages WHERE id = $1`, [id])
  res.json(result.rows[0])
})

export default router
```

Hinweis: `POST/PUT/DELETE` fuer `pages` gehoeren nach SP23 und werden in SP17 bewusst nicht vorgezogen.

---

## Task 3: Express-Router fuer `page_links` (GET-only)

**Files:**
- Create: `server/routes/pageLinks.ts`

- [ ] **Step 4: `server/routes/pageLinks.ts` erstellen**

```typescript
import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

// GET /api/page-links/by-project/:projectId
router.get('/by-project/:projectId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT pl.* FROM page_links pl
     JOIN projects p ON p.id = pl.project_id
     WHERE pl.project_id = $1 AND p.user_id = $2
     ORDER BY pl.created_at ASC`,
    [routeParamOne(req.params.projectId), req.userId]
  )
  res.json(result.rows)
})

export default router
```

Hinweis: `POST/PUT/DELETE` fuer `page_links` gehoeren nach SP23 und werden in SP17 bewusst nicht vorgezogen.

---

## Task 4: Router in `server/index.ts` registrieren

**Files:**
- Modify: `server/index.ts`

- [ ] **Step 5: Imports und `app.use`-Zeilen einfuegen**

In `server/index.ts` zwei Import-Zeilen nach den bestehenden Router-Imports einfuegen:

```typescript
import pagesRouter from './routes/pages.js'
import pageLinksRouter from './routes/pageLinks.js'
```

Und zwei `app.use`-Zeilen nach den bestehenden API-Routen:

```typescript
app.use('/api/pages', pagesRouter)
app.use('/api/page-links', pageLinksRouter)
```

- [ ] **Step 6: Server-Build pruefen**

```bash
npm run build
```

Erwartetes Ergebnis: Build gruen, kein TypeScript-Fehler.

---

## Task 5: apiClient-Stubs

**Files:**
- Modify: `src/lib/apiClient.ts`

- [ ] **Step 7: `pages` und `pageLinks` Namespaces einfuegen**

In `src/lib/apiClient.ts` am Ende des `apiClient`-Objekts ergaenzen:

```typescript
  pages: {
    getByProject: (projectId: string) =>
      request<any[]>('GET', `/api/pages/by-project/${projectId}`),
    getById: (id: string) => request<any>('GET', `/api/pages/${id}`),
  },

  pageLinks: {
    getByProject: (projectId: string) =>
      request<any[]>('GET', `/api/page-links/by-project/${projectId}`),
  },
```

Hinweis: Mutationsmethoden kommen erst mit SP23.

---

## Task 6: FilterSidebar-Komponente

**Files:**
- Create: `src/components/link-graph/FilterSidebar.tsx`

- [ ] **Step 8: `FilterSidebar.tsx` erstellen**

```tsx
export function FilterSidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter</p>
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Typ</p>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Hub
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Unterkategorie
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Blog
        </label>
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Status</p>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Veroeffentlicht
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Draft
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Geplant
        </label>
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Phase</p>
        <div className="grid grid-cols-3 gap-2">
          {['A', 'B', 'C', 'D', 'E', 'F'].map((phase) => (
            <button
              key={phase}
              type="button"
              disabled
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400 cursor-not-allowed"
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold text-slate-700 mb-2">Analyse</p>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Verwaiste Seiten
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Tote Enden
        </label>
      </div>
    </aside>
  )
}
```

---

## Task 7: LinkGraphView-Komponente

**Files:**
- Create: `src/components/link-graph/LinkGraphView.tsx`

- [ ] **Step 9: `LinkGraphView.tsx` erstellen**

```tsx
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { FilterSidebar } from './FilterSidebar'

interface LinkGraphViewProps {
  projectName: string
}

export function LinkGraphView({ projectName }: LinkGraphViewProps) {
  // SP18 ersetzt diese Platzhalter durch echte Daten aus usePages/usePageLinks.
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
```

Hinweis: `projectId` wird hier bewusst nicht als ungenutzte Prop gefuehrt.

---

## Task 8: TanStack Router Route

**Files:**
- Create: `src/routes/projects/$projectId/link-graph.tsx`

- [ ] **Step 10: Route-Datei erstellen**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { LinkGraphView } from '@/components/link-graph/LinkGraphView'
import { useProject } from '@/hooks/useProject'

export const Route = createFileRoute('/projects/$projectId/link-graph')({
  component: LinkGraphPage,
})

function LinkGraphPage() {
  const { projectId } = Route.useParams()
  const { data: project } = useProject(projectId)

  return <LinkGraphView projectName={project?.name ?? '...'} />
}
```

- [ ] **Step 11: Route-Generierung pruefen**

```bash
npm run dev
```

TanStack Router sollte die neue Route-Datei erkennen und `src/routeTree.gen.ts` regenerieren.

Pruefe explizit:

- die Datei `src/routeTree.gen.ts` wurde aktualisiert
- die Dev-Konsole zeigt keinen Router-Fehler

Wenn `routeTree.gen.ts` nicht aktualisiert wird, nicht blind committen, sondern erst die Generator-Konfiguration pruefen.

- [ ] **Step 12: Route im Browser pruefen**

Oeffne `http://localhost:5173` und navigiere zu einem Projekt. Haenge manuell `/link-graph` an die URL an, z. B.:

`http://localhost:5173/projects/<uuid>/link-graph`

Erwartetes Ergebnis:

- Topbar zeigt Projektname + `Link Graph` + deaktivierten Export-Button
- links: Filter-Sidebar mit deaktivierten Controls fuer Typ, Status, Phase und Analyse
- Mitte: gepunktetes Raster-Canvas
- mittig: Empty-State-Text `Noch keine Seiten vorhanden`
- kein JS-Fehler in der Browser-Konsole

- [ ] **Step 13: Final-Build pruefen**

```bash
npm run build
```

Erwartetes Ergebnis: Build gruen.

---

## Task 9: Sichtbarer Einstiegspunkt dokumentieren

- [ ] **Step 14: Zugang zur Route im Plan festhalten**

Da unter `src/routes/projects/$projectId` aktuell kein bestehender Projekt-Layout-Entry existiert, ist fuer SP17 ein manueller URL-Aufruf ausreichend. Halte im Umsetzungs-Log fest, dass ein sichtbarer Navigationseinstieg erst in einem Folge-SP oder bei produktiver Einbindung ergaenzt werden muss.

---

## Task 10: Roadmap-Log + Commit

**Files:**
- Modify: `docs/ROADMAP_LinkGraph.md`

- [ ] **Step 15: Roadmap-Log fuer SP17 aktualisieren**

In `docs/ROADMAP_LinkGraph.md` den SP17-Abschnitt aktualisieren:

```markdown
**Status:** [x] Abgeschlossen

**Log:**
- 2026-04-23 - gestartet
- 2026-04-23 - GET-Routen, apiClient-Stubs, FilterSidebar, LinkGraphView, Route erstellt
- 2026-04-23 - abgeschlossen
```

Und in der Fortschrittstabelle:

```markdown
| SP17 | Leere Graph-View | ~2h | [x] |
```

- [ ] **Step 16: Commit**

```bash
git add server/routes/pages.ts server/routes/pageLinks.ts server/index.ts src/lib/apiClient.ts src/components/link-graph/FilterSidebar.tsx src/components/link-graph/LinkGraphView.tsx src/routes/projects/$projectId/link-graph.tsx docs/ROADMAP_LinkGraph.md
git add src/routeTree.gen.ts
git commit -m "feat(sp17): leere Link-Graph-View - GET-Routen, apiClient und React Flow Empty State"
```

Hinweis: `src/routeTree.gen.ts` nur committen, wenn die Datei tatsaechlich regeneriert wurde.

---

## Self-Review Checklist

- [x] **Spec-Abdeckung:** Route `/projects/$projectId/link-graph`, React Flow, Empty State, Topbar, visuelle Filter-Sidebar, API-Client-Stubs, GET-Routen fuer `pages` und `page_links`
- [x] **Kein Scope-Leak:** Mutationen fuer `pages` und `page_links` bleiben aus SP17 heraus und kommen spaeter
- [x] **UI-Struktur vorbereitet:** Sidebar enthaelt bereits den Phase-Placeholder gemaess Spec/Roadmap
- [x] **Typ-Sauberkeit:** `LinkGraphView` hat keine ungenutzte `projectId`-Prop
- [x] **routeTree defensiv behandelt:** Generierte Datei wird nur bei realer Aktualisierung committed
- [x] **Navigation klar:** Manueller URL-Aufruf ist fuer SP17 akzeptiert, sichtbarer Einstiegspunkt bleibt als Folgeaufgabe explizit benannt
