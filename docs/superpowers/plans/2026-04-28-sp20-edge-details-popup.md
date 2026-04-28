# SP20 — Edge-Details-Popup (Link Graph)

> **For agentic workers:** OPTIONAL: superpowers:subagent-driven-development / executing-plans. Steps mit Checkbox-Tracking.

**Goal:** Klick auf eine aggregierte Kante oeffnet ein Modal mit Von → Nach und allen Link-**Instanzen** (Anker, Kontext, Platzierung, Zeilen). Bearbeiten-Modal als UI-Shell; Persistenz folgt SP23. „Im Editor oeffnen“ vorbereitet, aktiv in SP22.

**Architecture:** `selectedEdgeId` in `LinkGraphView` parallel zu `selectedPageId`. `onEdgeClick` setzt Kanten-ID und leert Node-Auswahl; `onNodeClick` umgekehrt; `onPaneClick` leert beides. Kanten-ID aus SP18: `` `${from_page_id}__${to_page_id}` ``. `selectedEdgeBundle` wird per `useMemo` aus `edges`, `pages` und `edge.data.links` aufgeloest (kein zusaetzlicher API-Call). `EdgeDetailsPopup` rendert per `createPortal` nach `document.body` (z-50). `LinkEditModal` darueber (z-60). `interactionWidth: 20` auf Edges fuer groessere Klickflaeche.

**Tech Stack:** React 18 + TypeScript, `@xyflow/react` v12 (`EdgeMouseHandler`), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-23-link-graph-design.md` (SP20)

---

## Datei-Uebersicht

| Aktion | Pfad | Zweck |
|--------|------|-------|
| Create | `src/components/link-graph/EdgeDetailsPopup.tsx` | Modal: Kopf, Liste Instanzen, „Im Editor oeffnen“ |
| Create | `src/components/link-graph/LinkEditModal.tsx` | Bearbeiten-Dialog, Felder disabled, Speichern disabled |
| Modify | `src/components/link-graph/LinkGraphView.tsx` | `selectedEdgeId`, `onEdgeClick`, `selectedEdgeBundle`, Popup |

---

## Task 1: EdgeDetailsPopup

- [x] **Step 1:** Props: `open`, `onClose`, `fromPage`, `toPage`, `links: PageLinkRow[]`.
- [x] **Step 2:** Kopf: Titel „Verlinkung“, Zeile Quelle → Ziel, Anzahl Instanzen.
- [x] **Step 3:** Pro Link-Zeile: Anker, optional Kontextsatz, Platzierung, Zeile(n) via Hilfsfunktion `lineLabel`.
- [x] **Step 4:** „Bearbeiten…“ pro Instanz oeffnet `LinkEditModal` mit lokalem State `editingLink`.
- [x] **Step 5:** „Im Editor oeffnen“: disabled; `canOpenEditor` nur wenn `fromPage.markdown_file_path`; Tooltip SP22.
- [x] **Step 6:** Schliessen: X und Backdrop; `handleCloseAll` setzt `editingLink` zurueck und ruft `onClose`.

---

## Task 2: LinkEditModal

- [x] **Step 7:** Portal-Modal mit Feldern Anker, Kontext, Platzierung, Zeile von/bis — aus `PageLinkRow` per `useEffect` bei `link`-Wechsel.
- [x] **Step 8:** Inputs `disabled`; Hinweisbox PUT `/api/page-links/:id` / Client SP23; Button „Speichern“ disabled.

---

## Task 3: LinkGraphView

- [x] **Step 9:** `import type { EdgeMouseHandler }`; State `selectedEdgeId`.
- [x] **Step 10:** `handleEdgeClick`: `setSelectedPageId(null)`, `setSelectedEdgeId(edge.id)`; `handleNodeClick` leert Kante; `handlePaneClick` leert beides.
- [x] **Step 11:** `useMemo` `selectedEdgeBundle`: Edge finden, `data.links` casten, `from`/`to` `PageRow` aus `pages`.
- [x] **Step 12:** Pro Edge in `useMemo` (SP18): `interactionWidth: 20` ergaenzen.
- [x] **Step 13:** Conditional: `{selectedEdgeBundle && <EdgeDetailsPopup open … />}`.

---

## Task 4: Verifikation

- [x] **Step 14:** `npm run build` gruen.

---

## Manuelle Verifikation

1. Link Graph mit mindestens einer Kante (mehrere `page_links` gleiche Quelle+Ziel optional) oeffnen.
2. Kante klicken → Modal mit Von/Nach und allen Instanzen.
3. Node-Panel schliesst sich; Node klicken schliesst Kanten-Popup-Kontext (kein gleichzeitiges Edge-Bundle ohne erneuten Klick — Auswahl wechselt).
4. Leerer Canvas-Klick schliesst Auswahl.
5. „Bearbeiten…“ → zweites Modal; „Speichern“ nicht klickbar.
6. „Im Editor oeffnen“ disabled (ohne SP22).

---

## Commit-Hinweis

```bash
git add src/components/link-graph/EdgeDetailsPopup.tsx \
  src/components/link-graph/LinkEditModal.tsx \
  src/components/link-graph/LinkGraphView.tsx \
  docs/superpowers/plans/2026-04-28-sp20-edge-details-popup.md \
  docs/ROADMAP_LinkGraph.md
git commit -m "feat(sp20): Edge-Details-Popup und Link-Bearbeiten-Modal (UI)"
```

---

**Status:** Umgesetzt 2026-04-28.
