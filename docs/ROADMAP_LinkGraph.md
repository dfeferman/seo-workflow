# Roadmap: Link Graph Feature (SP16-SP25)

**Design Spec:** `docs/superpowers/specs/2026-04-23-link-graph-design.md`  
**Konzept:** `docs/konzept/KONZEPT_Verlinkungsarchitektur_Visualisierung.md`

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
- 2026-04-23 — abgeschlossen (Migration noch manuell in Supabase auszufuehren)

---

## SP17 - Leere Graph-View (Empty State)

**Geschaetzte Dauer:** ~2h  
**Status:** [x] Abgeschlossen  
**Abhaengig von:** SP16

**Deliverables:**
- Route `src/routes/projects/$projectId/link-graph.tsx`
- `LinkGraphView.tsx` mit Empty State
- Topbar (Breadcrumb + Export-Button-Platzhalter)
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
**Status:** [ ] Todo  
**Abhaengig von:** SP18

**Deliverables:**
- `src/components/link-graph/NodeDetailsPanel.tsx`
- Klick auf Node -> Panel rechts oeffnet
- Anzeige: Name, Typ, Status, Wortcount, Kategorie-/Phase-Kontext, Incoming/Outgoing Links (mit Anchor-Texten)
- Aktionen: Markdown in App oeffnen, Seite bearbeiten, Seite loeschen

**Log:**

---

## SP20 - Edge-Details-Popup

**Geschaetzte Dauer:** ~2h  
**Status:** [ ] Todo  
**Abhaengig von:** SP18

**Deliverables:**
- Edge-onClick-Handler
- Popup/Tooltip: Von -> Nach, Anchor-Text, Kontextsatz, Platzierung, Zeile im File
- Button "Im Editor oeffnen" fuer interne Content-Ansicht
- Bearbeiten-Modal fuer Link-Details

**Log:**

---

## SP21 - Filter & Suche

**Geschaetzte Dauer:** ~3h  
**Status:** [ ] Todo  
**Abhaengig von:** SP18

**Deliverables:**
- Filter-State (Zustand/Context)
- Multi-Select: Typ (Hub / Spoke / Blog), Status (Published / Draft / Planned), Phase
- Toggle: "Verwaiste Seiten" (keine Incoming Links)
- Toggle: "Tote Enden" (keine Outgoing Links)
- Suche in Topbar -> Node hervorheben + hinzoomen
- Phase-Filter ueber `pages.category_id -> categories -> artifacts.phase`

**Log:**

---

## SP22 - Markdown-Upload & Parsing

**Geschaetzte Dauer:** ~5h  
**Status:** [ ] Todo  
**Abhaengig von:** SP18

**Deliverables:**
- Drag & Drop Zone ueber Graph-Canvas
- Upload nach Supabase Storage
- `remark`-Parser: extrahiert Title (`# Heading`) + Links `[text](url)` + Zeilennummer
- Auto-Matching: URL -> vorhandener Node
- Fallback: Geplant-Node erstellen wenn kein Match
- Graph-Re-Render nach Upload

**Log:**

---

## SP23 - Seite & Link manuell anlegen

**Geschaetzte Dauer:** ~3h  
**Status:** [ ] Todo  
**Abhaengig von:** SP18

**Deliverables:**
- `AddPageModal.tsx` (Name, Typ Hub/Spoke/Blog, URL-Slug, optionale Kategorie)
- `AddLinkModal.tsx` (Von, Nach, Anchor-Text, Kontextsatz, Platzierung)
- Supabase-/API-Insert bei Submit
- Graph-Re-Render (TanStack Query Invalidate)

**Log:**

---

## SP24 - Export-Funktionen

**Geschaetzte Dauer:** ~2h  
**Status:** [ ] Todo  
**Abhaengig von:** SP18

**Deliverables:**
- PNG-Export (React Flow `getViewport()` + HTML Canvas)
- JSON-Export (alle Nodes + Edges als strukturiertes JSON)
- Markdown-Report (Tabelle: Von | Nach | Anchor | Platzierung | Zeile)
- Download-Buttons in Topbar

**Log:**

---

## SP25 - Polish & UX

**Geschaetzte Dauer:** ~2h  
**Status:** [ ] Todo  
**Abhaengig von:** SP19, SP20, SP21

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
| SP19 | Node-Details-Panel | ~3h | [ ] |
| SP20 | Edge-Details-Popup | ~2h | [ ] |
| SP21 | Filter & Suche | ~3h | [ ] |
| SP22 | Markdown-Upload & Parsing | ~5h | [ ] |
| SP23 | Manuell anlegen | ~3h | [ ] |
| SP24 | Export-Funktionen | ~2h | [ ] |
| SP25 | Polish & UX | ~2h | [ ] |
| **Gesamt** |  | **~27h** | 0/10 |

---

## Log-Vorlage

Beim Start eines SP diesen Eintrag unter "Log:" einfuegen:

```text
- YYYY-MM-DD HH:MM - gestartet
- YYYY-MM-DD HH:MM - [Notiz zu Zwischenstand oder Blocker]
- YYYY-MM-DD HH:MM - abgeschlossen
```
