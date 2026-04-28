# Roadmap: Link Graph Feature (SP16-SP25)

**Design Spec:** `docs/superpowers/specs/2026-04-23-link-graph-design.md`  
**Konzept:** `docs/konzept/SEO-Verlinkung/KONZEPT_Verlinkungsarchitektur_Visualisierung.md`  
**Plan SP20:** `docs/superpowers/plans/2026-04-28-sp20-edge-details-popup.md`  
**Plan SP21:** `docs/superpowers/plans/2026-04-28-sp21-filter-suche.md`  
**Plan SP22:** `docs/superpowers/plans/2026-04-28-sp22-markdown-upload.md`  
**Spec SP22:** `docs/superpowers/specs/2026-04-28-sp22-markdown-upload-design.md`  
**Plan SP23:** `docs/superpowers/plans/2026-04-29-sp23-manual-page-link.md`  
**Spec SP23:** `docs/superpowers/specs/2026-04-29-sp23-manual-page-link-design.md`  
**Spec SP24:** `docs/superpowers/specs/2026-04-29-sp24-link-graph-export-design.md`  
**Plan SP24:** `docs/superpowers/plans/2026-04-29-sp24-link-graph-export.md`  

**Stand (letzte Pflege: 2026-04-29):** SP16–SP24 **abgeschlossen**. **Offen:** **SP25** (Polish & UX, ~2h).  
Route: **`/projects/$projectId/link-graph`**. Daten: TanStack Query + Express (**kein** Supabase-Client im Link Graph).

**Umgesetzt (Auszug):**

| Bereich | Dateien / Endpunkte |
|---------|---------------------|
| **Frontend** | `LinkGraphView.tsx` (DnD SP22, Modals SP23, Export SP24), `LinkGraphExportMenu.tsx`, `linkGraphExport.ts`, `linkGraphExport.test.ts`, `FilterSidebar.tsx`, `linkGraphFilter.ts`, `LinkGraphFitView.tsx`, `NodeDetailsPanel.tsx`, `EdgeDetailsPopup.tsx`, `LinkEditModal.tsx`, `PageFormModal.tsx`, `AddLinkModal.tsx`, Nodes `Hub`/`Spoke`/`Blog`, `graphLayout.ts` |
| **NPM SP24** | `html-to-image` (PNG-Export) |
| **Hooks** | `usePages`, `usePageLinks`, `useProjectCategoryPhases` |
| **Backend SP22** | `POST /api/pages/import-markdown/:projectId`, `server/services/markdownProjectImport.ts`, `server/lib/` (sanitize, normalize, extract, dedupe); Konfiguration `UPLOAD_ROOT` |
| **Backend SP23** | `POST`/`PUT` `server/routes/pages.ts`, `POST`/`PUT` `server/routes/pageLinks.ts` (`/api/pages`, `/api/page-links`; kein DELETE) |
| **Runtime** | PostgreSQL (lokal/NAS); Express-API (**kein** Link-Graph‑Client auf Supabase Storage) |

---

## Status-Legende

```text
[ ] Todo
[>] In Arbeit
[x] Abgeschlossen
[!] Blockiert
```

---

## SP16 - Datenmodell fuer Link Graph

**Geschaetzte Dauer:** ~1h  
**Status:** [x] Abgeschlossen

**Deliverables:**
- `supabase/migrations/006_link_graph.sql` mit `pages`, `page_links`, `pages.category_id`, Indexes und RLS Policies
- TypeScript-Types in `src/types/database.types.ts` ergaenzen
- Link-Instanz-Modell ueber Unique-Constraint auf `(from_page_id, to_page_id, anchor_text, line_number_start, line_number_end)`

**Log:**
- 2026-04-23 — gestartet
- 2026-04-23 — Migration 006_link_graph.sql erstellt, TypeScript-Typen ergaenzt, Build gruen
- 2026-04-23 — abgeschlossen (Migration in der jeweiligen Postgres-Instanz ausführen; RLS bezieht sich auf JWT/Supabase-typische Policies — bei barem Postgres ggf. anpassen)

---

## SP17 - Leere Graph-View (Empty State)

**Geschaetzte Dauer:** ~2h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP16

**Deliverables:**
- Route `src/routes/projects/$projectId/link-graph.tsx`
- `LinkGraphView.tsx` mit Empty State
- Topbar (Breadcrumb; Export dort zunächst Platzhalter — **Ausführung** in **SP24**)
- Linke Filter-Sidebar (Struktur, noch nicht funktional)
- React Flow + Dagre installiert
- API-Client-Stubs fuer `apiClient.pages` und `apiClient.pageLinks`
- Express-Routen fuer `/api/pages/*` und `/api/page-links/*` angelegt

**Log:**
- 2026-04-23 — gestartet
- 2026-04-23 — GET-Routen pages + pageLinks, apiClient-Stubs, FilterSidebar, LinkGraphView, Route erstellt
- 2026-04-23 — abgeschlossen

---

## SP18 - Nodes & Edges rendern

**Geschaetzte Dauer:** ~4h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP17

**Deliverables:**
- `src/hooks/usePages.ts`
- `src/hooks/usePageLinks.ts`
- Custom Node-Komponenten: `HubNode.tsx`, `SpokeNode.tsx`, `BlogNode.tsx`
- `src/components/link-graph/graphLayout.ts` — Dagre Auto-Layout
- Edges mit Staerke aus aggregierten Link-Instanzen

**Log:**
- 2026-04-23 — gestartet
- 2026-04-23 — Hooks, Node-Komponenten, Layout, Rendering abgeschlossen
- 2026-04-23 — abgeschlossen

---

## SP19 - Node-Details-Panel

**Geschaetzte Dauer:** ~3h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP18

**Deliverables:**
- `src/components/link-graph/NodeDetailsPanel.tsx`
- Klick auf Node -> Panel rechts oeffnet
- Anzeige: Name, Typ, Status, Wortcount, Kategorie-/Phase-Kontext, Incoming/Outgoing Links (mit Anchor-Texten)
- Aktionen: „Im Editor oeffnen“ (mit `markdown_file_path` nach SP22-Upload vorbereitet; **lesende** interne Ansicht / Polish in SP25), **Bearbeiten** (SP23 → `PageFormModal`), Loeschen **spaeter / nicht SP23**

**Log:**
- 2026-04-28 — umgesetzt (selectedPageId in LinkGraphView, onNodeClick / onPaneClick, useCategory fuer Kategorie/Phase)

---

## SP20 - Edge-Details-Popup

**Geschaetzte Dauer:** ~2h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP18

**Deliverables:**
- Edge-onClick-Handler (`onEdgeClick`, `interactionWidth` fuer groessere Klickflaeche)
- `EdgeDetailsPopup.tsx`: Von -> Nach, pro Instanz Anchor, Kontext, Platzierung, Zeilen
- Button **„Im Editor oeffnen“** wenn Quell-Seite `markdown_file_path` hat (Platzhalter-Tooltips bis **interne Vorschau** in SP25; Storage: `UPLOAD_ROOT`)
- `LinkEditModal.tsx`: Bearbeiten-UI, Speichern per **PUT** ab SP23/API

**Log:**
- 2026-04-28 — umgesetzt (Modal via Portal, Kantenwahl schliesst Node-Panel und umgekehrt; siehe Plan `docs/superpowers/plans/2026-04-28-sp20-edge-details-popup.md`)

---

## SP21 - Filter & Suche

**Geschaetzte Dauer:** ~3h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP18

**Deliverables:**
- Filter-State in `LinkGraphView` + `linkGraphFilter.ts` (reine Funktionen)
- Multi-Select: Typ (Hub / Spoke / Blog), Status (Published / Draft / Planned), Phase (A–G, X)
- Toggle: Verwaiste Seiten / Tote Enden (basierend auf allen `page_links` des Projekts)
- Suche in Topbar: Treffer hervorheben (Ring), andere dimmen, `fitView` auf Treffer (`LinkGraphFitView`)
- Phase: `useProjectCategoryPhases` laedt Artefakt-Phasen pro Kategorie; Filter wie Spec (ohne `category_id` keine Uebereinstimmung bei aktivem Phasenfilter)

**Log:**
- 2026-04-28 — umgesetzt (siehe Plan `docs/superpowers/plans/2026-04-28-sp21-filter-suche.md`)

---

## SP22 - Markdown-Upload & Parsing

**Geschaetzte Dauer:** ~5h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP18

**Deliverables:**
- Drag & Drop Zone ueber Graph-Canvas
- Upload per Express multipart nach `UPLOAD_ROOT` (siehe `.env` / RUNBOOK), kein Supabase Storage
- `remark`-Parser: extrahiert Title (`# Heading`) + Links `[text](url)` + Zeilennummer
- Auto-Matching: URL -> vorhandener Node (Slug)
- Fallback: Geplant-Node erstellen wenn kein Match
- Graph-Re-Render nach Upload (`invalidateQueries` pages / page-links)

**Log:**
- 2026-04-28 — umgesetzt: `POST /api/pages/import-markdown/:projectId` (multipart), `markdownProjectImport`, `server/lib/*`, Drag&Drop + Query-Invalidate im `LinkGraphView`; Spec `docs/superpowers/specs/2026-04-28-sp22-markdown-upload-design.md`

---

## SP23 - Seite & Link manuell anlegen

**Geschaetzte Dauer:** ~3h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP18

**Deliverables:**
- `PageFormModal.tsx` Create/Edit (Name, Typ, URL-Slug, Status, Kategorie; kein Clearing von `markdown_file_path`)
- Sidebar: „Seite anlegen“ / „Link anlegen“ (`FilterSidebar` + `graphEditActions` in `LinkGraphView`)
- `AddLinkModal.tsx` (Von/Nach, optionale Anchor-/Kontext-/Platzierungs-/Zeilenfelder; keine Selbstlinks)
- `NodeDetailsPanel` „Bearbeiten“ → gleiches Modal im Edit-Modus
- `LinkEditModal` + `EdgeDetailsPopup` mit `projectId`; **POST/PUT** Express (`pages.ts`, `pageLinks.ts`), **kein DELETE**
- Invalidate `pages` / `page-links` nach erfolgreicher Mutation

**Log:**
- 2026-04-29 — abgeschlossen (siehe Plan `docs/superpowers/plans/2026-04-29-sp23-manual-page-link.md`)

---

## SP24 - Export-Funktionen

**Geschaetzte Dauer:** ~2h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP18  
**Design:** `docs/superpowers/specs/2026-04-29-sp24-link-graph-export-design.md`  
**Plan:** `docs/superpowers/plans/2026-04-29-sp24-link-graph-export.md`

**Deliverables:**
- Topbar-Dropdown **Export** (`@headlessui/react` **Menu**) mit Grafik (**PNG** über `html-to-image` **`toBlob`**, Graph-Wrapper-`ref`, aktuelle gefilterte Ansicht)
- **JSON:** `pages` + `page_links` vollständig (sortiert), ohne Filter
- **Markdown:** eine Tabelle pro `page_links`-Zeile inkl. URL-Slugs und Zeilen; `|` in Zellen → `·`
- `src/lib/linkGraphExport.ts`, `linkGraphExport.test.ts`; Kurz-Feedback-Banner nach Download

**Log:**
- 2026-04-29 — umgesetzt (Plan `docs/superpowers/plans/2026-04-29-sp24-link-graph-export.md`)

---

## SP25 - Polish & UX

**Geschaetzte Dauer:** ~2h  
**Status:** [ ] Todo  
**Abhaengig von:** SP19, SP20, SP21 (optional inhaltlich **SP22** fuer Upload-Fehlermeldungen / Editor-Polish). **Nach** SP22/23/24: alle Kernflows (Upload, Mutation, Export) sind da; Polish schliesst UX-Lücken.

**Deliverables:**
- Zoom-Controls (+ / - Buttons)
- Fit-to-Screen-Button
- Loading-Skeleton beim Laden der Daten
- Error-Handling fuer unbekannte URLs beim Parsing
- Fade-In-Animation bei neuen Nodes
- Hover-Tooltips auf Nodes (Name + Status)

**Log:**

---

## Gesamt-Fortschritt

| SP | Name | Dauer | Status |
|----|------|-------|--------|
| SP16 | Datenmodell | ~1h | [x] |
| SP17 | Leere Graph-View | ~2h | [x] |
| SP18 | Nodes & Edges rendern | ~4h | [x] |
| SP19 | Node-Details-Panel | ~3h | [x] |
| SP20 | Edge-Details-Popup | ~2h | [x] |
| SP21 | Filter & Suche | ~3h | [x] |
| SP22 | Markdown-Upload & Parsing | ~5h | [x] |
| SP23 | Manuell anlegen | ~3h | [x] |
| SP24 | Export-Funktionen | ~2h | [x] |
| SP25 | Polish & UX | ~2h | [ ] |
| **Gesamt** |  | **~27h** | **9/10 SP** |

**Schaetzung offen:** SP25 ≈ **~2h** (Rest).

---

## Log-Vorlage

Beim Start eines SP diesen Eintrag unter "Log:" einfuegen:

```text
- YYYY-MM-DD HH:MM - gestartet
- YYYY-MM-DD HH:MM - [Notiz zu Zwischenstand oder Blocker]
- YYYY-MM-DD HH:MM - abgeschlossen
```
