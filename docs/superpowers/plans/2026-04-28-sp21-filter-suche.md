# SP21 — Filter & Suche (Link Graph)

> **For agentic workers:** OPTIONAL: superpowers:subagent-driven-development / executing-plans. Steps mit Checkbox-Tracking.

**Goal:** Sidebar-Filter (Typ, Status, Phase, Verwaist/Tote Enden) und Topbar-Suche mit Hervorhebung + `fitView` auf Treffer.

**Architecture:** Filter-State lebt in `LinkGraphView` (`useState<LinkGraphFilters>`). Reine Filterlogik in `linkGraphFilter.ts` (`filterPagesForGraph`). Sichtbare Kanten = nur Links, deren Quell- und Ziel-Seite in der gefilterten Seitenmenge liegen. Phasen: `useProjectCategoryPhases` baut `Map<categoryId, Set<phase>>` aus `categories.getByProject` + parallel `artifacts.getByCategory` (kein neuer Backend-Endpoint). Suche: Treffer erhalten `searchMatch`/`dimmed` in Node-`data`; `LinkGraphFitView` (Child von `ReactFlow`) ruft `useReactFlow().fitView` mit `nonce` auf, damit wiederholte Suchen zoomen.

**Tech Stack:** React 18 + TypeScript, `@xyflow/react` v12, TanStack Query, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-23-link-graph-design.md` (Abschnitt Filterlogik)

---

## Datei-Uebersicht

| Aktion | Pfad | Zweck |
|--------|------|-------|
| Create | `src/hooks/useProjectCategoryPhases.ts` | Phasen-Menge pro Kategorie (Artefakte) |
| Create | `src/components/link-graph/linkGraphFilter.ts` | Typen, Defaults, Toggles, `filterPagesForGraph` |
| Create | `src/components/link-graph/LinkGraphFitView.tsx` | `fitView` auf Such-Treffer |
| Modify | `src/components/link-graph/FilterSidebar.tsx` | Props `filters` + `onChange`, interaktive UI |
| Modify | `src/components/link-graph/LinkGraphView.tsx` | Filter, Suche, gefilterte Nodes/Edges, leere Zustaende |
| Modify | `src/components/link-graph/HubNode.tsx` | optional `dimmed`, `searchMatch` |
| Modify | `src/components/link-graph/SpokeNode.tsx` | wie HubNode |
| Modify | `src/components/link-graph/BlogNode.tsx` | wie HubNode |
| Modify | `docs/ROADMAP_LinkGraph.md` | SP21 abgeschlossen, Fortschritt |

---

## Task 1: Phasen-Daten

- [x] **Step 1:** Hook `useProjectCategoryPhases(projectId)` — Query-Key `['project-category-phases', projectId]`, fuer jede Kategorie `getByCategory`, Phasen normalisieren (ein Buchstabe A–X).

---

## Task 2: Filter-Logik

- [x] **Step 2:** `LinkGraphFilters`: `types`, `statuses`, `phases` als Arrays — **leer = kein Einschraenkung** (alle). `orphansOnly` / `deadEndsOnly` boolean.
- [x] **Step 3:** `toggleTypeFilter` / `toggleStatusFilter`: von „alle“ (leer) ersten Ausschluss; volle Auswahl wieder auf leer normalisieren.
- [x] **Step 4:** `filterPagesForGraph`: Typ/Status-Whitelist; Phase nur wenn `category_id` und Schnitt mit `categoryPhases`; Verwaist = incoming 0, Tote Enden = outgoing 0 (Zaehlung ueber **alle** `pageLinks` des Projekts).

---

## Task 3: Sidebar

- [x] **Step 5:** `FilterSidebar` — Checkboxen Typ/Status, Phase-Buttons A–G + X, Analyse-Toggles; Hinweistexte fuer leere Auswahl / Phase.

---

## Task 4: Graph-Integration

- [x] **Step 6:** `LinkGraphView` — `visiblePages`, `visibleIds`, `filteredLinks`; `useMemo` fuer Nodes/Edges + Dagre nur auf gefilterter Menge.
- [x] **Step 7:** `isLoading` erweitern: wenn `filters.phases.length > 0`, zusaetzlich `phasesLoading` abwarten.
- [x] **Step 8:** Bei Filterwechsel Such-Highlight zuruecksetzen; Node/Edge-Panel schliessen wenn Auswahl nicht mehr sichtbar.
- [x] **Step 9:** Overlay „Keine Seiten fuer aktuelle Filter“ wenn `pages.length > 0` aber `visiblePages.length === 0`.

---

## Task 5: Suche & Hervorhebung

- [x] **Step 10:** Topbar: Input + Button „Suchen“, Enter-Taste; Match: `name` case-insensitive substring auf **sichtbaren** Seiten.
- [x] **Step 11:** Node-Daten `dimmed` / `searchMatch`; Ring-Klasse in Custom-Nodes.
- [x] **Step 12:** `LinkGraphFitView` innerhalb `<ReactFlow>` — `fitView({ nodes, padding, duration })` mit `{ nodeIds, nonce }`.

---

## Task 6: Verifikation

- [x] **Step 13:** `npm run build` gruen.

---

## Manuelle Verifikation

1. Projekt mit `pages` + `page_links` + Kategorien/Artefakten oeffnen: `/projects/<id>/link-graph`
2. Typ/Status einschraenken — Graph aktualisiert, Kanten nur zwischen sichtbaren Nodes
3. Phase waehlen — nur Seiten mit passender `category_id` und Artefakt in dieser Phase; ohne Kategorie bei aktivem Phasenfilter ausgeblendet
4. Verwaist / Tote Enden — erwartete Teilmenge
5. Suche: Treffer mit Ring, andere dimmen; View zoomt auf Treffer; leere Suche entfernt Highlight
6. Filter aendern — Such-Highlight zurueckgesetzt

---

## Commit-Hinweis

```bash
git add src/hooks/useProjectCategoryPhases.ts src/components/link-graph/linkGraphFilter.ts \
  src/components/link-graph/LinkGraphFitView.tsx src/components/link-graph/FilterSidebar.tsx \
  src/components/link-graph/LinkGraphView.tsx src/components/link-graph/HubNode.tsx \
  src/components/link-graph/SpokeNode.tsx src/components/link-graph/BlogNode.tsx \
  docs/superpowers/plans/2026-04-28-sp21-filter-suche.md docs/ROADMAP_LinkGraph.md
git commit -m "feat(sp21): Link Graph Filter und Suche"
```

---

**Status:** Umgesetzt 2026-04-28.
