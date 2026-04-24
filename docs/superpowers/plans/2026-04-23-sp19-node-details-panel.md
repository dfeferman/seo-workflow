# SP19 — Node-Details-Panel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Klick auf einen Graph-Node öffnet ein Detail-Panel rechts mit Seiteninfos, Incoming/Outgoing Links und Aktions-Buttons.

**Architecture:** `selectedPageId` State lebt in `LinkGraphView`. React Flow's `onNodeClick` setzt die ID, `onPaneClick` leert sie. Das `NodeDetailsPanel` empfängt die vollständige `page`, alle `pages` und `pageLinks` als Props und leitet Incoming/Outgoing lokal ab — kein extra API-Call. Der Kategoriename wird via `useCategory` geholt (einmaliger API-Call wenn `category_id` vorhanden).

**Tech Stack:** React 18 + TypeScript, `@xyflow/react` v12, TanStack Query, Tailwind CSS

---

## Datei-Uebersicht

| Aktion | Pfad | Zweck |
|--------|------|-------|
| Create | `src/components/link-graph/NodeDetailsPanel.tsx` | Detail-Panel Komponente |
| Modify | `src/components/link-graph/LinkGraphView.tsx` | selectedPageId State + Handlers + Panel einbinden |

---

## Task 1: NodeDetailsPanel Komponente

**Files:**
- Create: `src/components/link-graph/NodeDetailsPanel.tsx`

- [ ] **Step 1: Datei erstellen**

```tsx
import { useCategory } from '@/hooks/useCategory'
import type { PageLinkRow, PageRow } from '@/types/database.types'

interface NodeDetailsPanelProps {
  page: PageRow
  pages: PageRow[]
  pageLinks: PageLinkRow[]
  onClose: () => void
}

const TYPE_BADGE: Record<string, string> = {
  hub: 'bg-blue-100 text-blue-700 border-blue-300',
  spoke: 'bg-green-100 text-green-700 border-green-300',
  blog: 'bg-yellow-100 text-yellow-700 border-yellow-300',
}

const TYPE_LABEL: Record<string, string> = {
  hub: 'Hub',
  spoke: 'Spoke',
  blog: 'Blog',
}

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  planned: 'bg-slate-100 text-slate-500',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Veröffentlicht',
  draft: 'Entwurf',
  planned: 'Geplant',
}

export function NodeDetailsPanel({ page, pages, pageLinks, onClose }: NodeDetailsPanelProps) {
  const { data: category } = useCategory(page.category_id ?? undefined)

  const pageById = new Map(pages.map((p) => [p.id, p]))

  const incoming = pageLinks.filter((l) => l.to_page_id === page.id)
  const outgoing = pageLinks.filter((l) => l.from_page_id === page.id)

  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-white border-l border-slate-200 shadow-lg flex flex-col z-10 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 truncate">{page.name}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${TYPE_BADGE[page.type] ?? 'bg-slate-100 text-slate-600 border-slate-300'}`}
            >
              {TYPE_LABEL[page.type] ?? page.type}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[page.status] ?? 'bg-slate-100 text-slate-500'}`}
            >
              {STATUS_LABEL[page.status] ?? page.status}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          aria-label="Panel schließen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Meta */}
      <div className="p-4 border-b border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Wortcount</span>
          <span className="font-medium text-slate-700">{page.word_count ?? 0}</span>
        </div>
        {page.url_slug && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">URL-Slug</span>
            <span className="font-medium text-slate-700 truncate max-w-40">{page.url_slug}</span>
          </div>
        )}
        {category && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Kategorie</span>
            <span className="font-medium text-slate-700 truncate max-w-40">{category.name}</span>
          </div>
        )}
        {category?.phase && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Phase</span>
            <span className="font-medium text-slate-700">{category.phase}</span>
          </div>
        )}
      </div>

      {/* Incoming Links */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Eingehende Links ({incoming.length})
        </p>
        {incoming.length === 0 ? (
          <p className="text-xs text-slate-300 italic">Keine eingehenden Links</p>
        ) : (
          <ul className="space-y-1.5">
            {incoming.map((link) => {
              const fromPage = pageById.get(link.from_page_id)
              return (
                <li key={link.id} className="text-xs">
                  <span className="text-slate-400">von </span>
                  <span className="font-medium text-slate-700">{fromPage?.name ?? link.from_page_id}</span>
                  {link.anchor_text && (
                    <span className="text-slate-400"> · „{link.anchor_text}"</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Outgoing Links */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Ausgehende Links ({outgoing.length})
        </p>
        {outgoing.length === 0 ? (
          <p className="text-xs text-slate-300 italic">Keine ausgehenden Links</p>
        ) : (
          <ul className="space-y-1.5">
            {outgoing.map((link) => {
              const toPage = pageById.get(link.to_page_id)
              return (
                <li key={link.id} className="text-xs">
                  <span className="text-slate-400">nach </span>
                  <span className="font-medium text-slate-700">{toPage?.name ?? link.to_page_id}</span>
                  {link.anchor_text && (
                    <span className="text-slate-400"> · „{link.anchor_text}"</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Aktionen */}
      <div className="p-4 space-y-2 mt-auto">
        <button
          disabled={!page.markdown_file_path}
          title={page.markdown_file_path ? 'Editor-View kommt in SP22' : 'Kein Dokument verknüpft'}
          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
        >
          Im Editor öffnen
        </button>
        <button
          disabled
          title="Bearbeiten kommt in SP23"
          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
        >
          Bearbeiten
        </button>
        <button
          disabled
          title="Löschen kommt in SP23"
          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-red-100 bg-white text-red-300 cursor-not-allowed"
        >
          Löschen
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: Build grün (NodeDetailsPanel ist noch nicht eingebunden, nur erstellt).

---

## Task 2: LinkGraphView — selectedPageId State + Panel einbinden

**Files:**
- Modify: `src/components/link-graph/LinkGraphView.tsx`

- [ ] **Step 3: Import und State ergänzen**

Ergänze am Anfang der Datei:

```tsx
import { useState } from 'react'
import type { NodeMouseHandler } from '@xyflow/react'
import { NodeDetailsPanel } from './NodeDetailsPanel'
```

Hinweis: `useMemo` ist bereits importiert — nicht doppelt importieren. Den `useState`-Import zu `useMemo` in die gleiche Zeile einbauen:

```tsx
import { useMemo, useState } from 'react'
```

State innerhalb der Komponente nach den Hook-Aufrufen:

```tsx
const [selectedPageId, setSelectedPageId] = useState<string | null>(null)

const selectedPage = pages.find((p) => p.id === selectedPageId) ?? null

const handleNodeClick: NodeMouseHandler = (_event, node) => {
  setSelectedPageId(node.id)
}

const handlePaneClick = () => {
  setSelectedPageId(null)
}
```

- [ ] **Step 4: ReactFlow — onNodeClick und onPaneClick ergänzen**

Den bestehenden `<ReactFlow ...>`-Block um die zwei Handler ergänzen:

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodeClick={handleNodeClick}
  onPaneClick={handlePaneClick}
  fitView
  proOptions={{ hideAttribution: true }}
>
  <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
</ReactFlow>
```

- [ ] **Step 5: NodeDetailsPanel im Canvas-Container einbinden**

Den `<div className="flex-1 relative">` Block so anpassen, dass das Panel am Ende (nach dem ReactFlow/Loading-Block, vor dem Empty-State) eingebaut ist:

```tsx
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
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
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

  {selectedPage && (
    <NodeDetailsPanel
      page={selectedPage}
      pages={pages}
      pageLinks={pageLinks}
      onClose={() => setSelectedPageId(null)}
    />
  )}
</div>
```

- [ ] **Step 6: Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: Build grün, keine TS-Fehler.

---

## Task 3: Roadmap + Commit

**Files:**
- Modify: `docs/ROADMAP_LinkGraph.md`

- [ ] **Step 7: Roadmap aktualisieren**

SP19-Block in `docs/ROADMAP_LinkGraph.md`:

```markdown
## SP19 - Node-Details-Panel

**Geschaetzte Dauer:** ~3h
**Status:** [x] Abgeschlossen
**Abhaengig von:** SP18

**Deliverables:**
- `src/components/link-graph/NodeDetailsPanel.tsx`
- Klick auf Node -> Panel rechts oeffnet
- Anzeige: Name, Typ, Status, Wortcount, Kategorie-/Phase-Kontext, Incoming/Outgoing Links
- Aktionen: Im Editor oeffnen, Bearbeiten, Loeschen (alle disabled bis SP22/SP23)

**Log:**
- 2026-04-23 — gestartet
- 2026-04-23 — abgeschlossen
```

SP19 in der Gesamt-Tabelle auf `[x]` setzen.

- [ ] **Step 8: Commit**

```bash
git add src/components/link-graph/NodeDetailsPanel.tsx src/components/link-graph/LinkGraphView.tsx docs/ROADMAP_LinkGraph.md
git commit -m "feat(sp19): Node-Details-Panel mit Incoming/Outgoing Links"
```

---

## Manuelle Verifikation

1. Dev-Server starten: `npm run dev` + `npm run server:dev`
2. Browser: `http://localhost:5173/projects/<uuid>/link-graph`
3. Auf einen Node klicken → Panel öffnet sich rechts
4. Panel zeigt: Name, Typ-Badge (blau/grün/gelb), Status-Badge, Wortcount
5. Auf leeren Canvas klicken → Panel schließt sich
6. X-Button → Panel schließt sich
7. Wenn `page_links` vorhanden: Incoming/Outgoing Links mit Anchor-Texten sichtbar
