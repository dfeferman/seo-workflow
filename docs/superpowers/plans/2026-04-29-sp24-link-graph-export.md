# SP24 — Link-Graph-Export (PNG, JSON, Markdown)

> **For agentic workers:** Schritte mit Checkbox (`- [ ]`) abarbeiten; nach Task kurz `npm run typecheck` / `npm run lint` sinnvoll.

**Goal:** Topbar-**Export** mit Dropdown: **PNG** (aktuelle Graph-Ansicht), **JSON** und **Markdown** (jeweils **vollständiges** Projekt laut `pages` / `page_links` aus TanStack Query). Kein neues Backend.

**Architecture:** Reine **Client-Logik** in `src/lib/linkGraphExport.ts` (Serialisierung, Sortierung, Markdown-Escape, Dateiname). **UI** als kleine Komponente für Dropdown + Trigger; **LinkGraphView** hält **`ref`** auf den **React-Flow-Container** (nur der Graph, ohne Topbar/Sidebar/Overlays) und übergibt Handler. PNG via **`html-to-image`** `toPng()` auf dieses DOM-Element.

**Tech Stack:** React 18, `@xyflow/react`, Tailwind, `@headlessui/react` (bereits Dependency) für zugängliches Menü.

**Spec:** `docs/superpowers/specs/2026-04-29-sp24-link-graph-export-design.md`

---

## Datei-Übersicht

| Aktion | Pfad |
|--------|------|
| Modify | `package.json` / Lock — Dependency **`html-to-image`** |
| Create | `src/lib/linkGraphExport.ts` — JSON/Markdown erzeugen, Sortierung, `triggerDownload`, Dateiname |
| Create | `src/components/link-graph/LinkGraphExportMenu.tsx` — Dropdown (Headless UI **Menu**), Tooltip/Hinweistext Spec 2.1 |
| Modify | `src/components/link-graph/LinkGraphView.tsx` — `ref` auf Graph-Wrapper, Export-Menü statt disabled Button, optionales kurzes Erfolgs-/Fehlerfeedback |
| Optional | `src/lib/linkGraphExport.test.ts` — reine Funktionen (Sortierung, Markdown-Escape) |
| Modify | `docs/ROADMAP_LinkGraph.md` — SP24 Log + Status nach Merge |

---

## Task 0: Dependency

- [ ] **Step 1:** `npm install html-to-image`
- [ ] **Step 2:** `npm run build` oder `npm run typecheck` — sicherstellen, dass keine Peer-Konflikte

---

## Task 1: `linkGraphExport.ts` (Kernlogik)

**Keine** React-Imports; nur Typen aus `@/types/database.types`.

### Sortierung (Spec Abschnitt 5)

- [ ] **`sortPagesForExport(pages: PageRow[])`:** Kopie `[...pages]`, Sortierung **`name`** locale `'de'` (secondary optional: `created_at`).
- [ ] **`sortLinksForExport(pageLinks: PageLinkRow[])`:** Kopie, Sortierung **`from_page_id`**, dann **`to_page_id`**, dann **`id`**.

### JSON

- [ ] **`buildLinkGraphJsonPayload(args: { exportedAt: string; projectId: string; projectName: string; pages: PageRow[]; pageLinks: PageLinkRow[] })`**
  - Rückgabe-Objekt exakt wie Spec: `exported_at`, `project_id`, `project_name`, `pages`, `page_links` mit sortierten Arrays.
  - `exportedAt`: `new Date().toISOString()` am Aufrufort übergeben oder in Helper.

### Markdown

- [ ] **`buildLinkGraphMarkdown(...)`:** Kopf `# Link-Export` / Projektname / Datum (ISO oder `de`-lesbar).
- [ ] **Tabelle:** Kopfzeile deutsch: `Von | Nach | URL Quelle | URL Ziel | Anker | Kontext | Platzierung | Zeile von | Zeile bis`
- [ ] Hilfs-Map **`pageId -> PageRow`** für Namen und Slugs; fehlende Seite bei orphan link: Fallback `--` oder rohe UUID in Klammern (einheitlich dokumentieren — Empfehlung **`Unbekannt (id…)`** nur wenn nötig, sonst `--`).
- [ ] **Zellinhalt:** `|` im Text **maskieren** (z. B. Ersetzen durch `·` oder Backslash nach CommonMark — **Empfehlung:** `\|` wenn Renderer es unterstützen soll; konservativ: **Pipe-Zeichen entfernen oder durch `/`**) — im Plan **festhalten und im Test festnageln**.
- [ ] Nullable Felder (`anchor_text`, …): leeren String oder **`--`** (einheitlich, z. B. **`--`**).
- [ ] **`url_slug`** in Spalten URL Quelle/Ziel anzeigen; wenn `null`/leer → **`--`**.

### Leeres `page_links`

- [ ] Nur Kopf + ein Absatz *„Keine Links im Projekt.“* (keine leere Tabelle ohne Erklärung).

### Download-Helfer

- [ ] **`downloadTextFile(filename: string, content: string, mime: string)`** via `Blob` + temporäres `<a download>` + `URL.revokeObjectURL`.
- [ ] **`fileBaseName(projectId: string)`:** `link-graph-{projectId erste 8 Zeichen ohne Bindestrich-Abschnitt oder komplette uuid kurz}-{yyyy-mm-dd}` — Spec 7; **Empfehlung:** `projectId.replace(/-/g, '').slice(0, 8)` oder erste UUID-Segment-Logik — **kollisionsarm** bei einem Projekt ausreichend.

---

## Task 2: PNG aus React Flow

### Ref-Struktur

- [ ] In **LinkGraphView** einen **`useRef<HTMLDivElement>(null)`** nur um **`ReactFlow`** legen — **nicht** um die gesamte Dropzone mit Overlays, damit **NodeDetailsPanel** / Fehlermeldungen / „Lade Graph“ nicht auf dem PNG erscheinen.
- [ ] Äußerer Dropzone-Div (**Drag&Drop**) **unverändert** um alles; **innerer** Wrapper `className="absolute inset-0"` oder `flex-1 min-h-0 w-full h-full` nur wenn `!isLoading`: **`ref={flowContainerRef}`** + `<ReactFlow …>`.

### Handler

- [ ] **`import { toPng } from 'html-to-image'`** (oder `toBlob` → Download).
- [ ] **`toPng(flowContainerRef.current, { backgroundColor: '#ffffff', cacheBust: true, pixelRatio: 2 })`** — `pixelRatio` optional für schärferes Bild; bei Performance-Problemen auf `1` reduzieren.
- [ ] **`try/catch`:** bei Fehler **deutsche** Meldung (Spec), z. B. **`Grafik-Export fehlgeschlagen. Bitte Seite neu laden und erneut versuchen.`**
- [ ] wenn `ref.current === null` oder weiterhin **`isLoading`:** Export nicht ausführen (Button ohnehin disabled).

### SVG/ForeignObject Hinweis

- [ ] Falls Export leer/fehlerhaft: in Task prüfen, ob zusätzliche Option **`filter`** auf Node reduziert werden muss (html-to-image-Doku); nur bei nachweisbarem Problem im Plan dokumentieren.


---

## Task 3: `LinkGraphExportMenu.tsx`

- [ ] **Headless UI:** `Menu`, `MenuButton`, `MenuItems`, `MenuItem` aus `@headlessui/react`.
- [ ] Props: **`projectId`**, **`projectName`**, **`pages`** (komplett), **`pageLinks`** (komplett), **`pngContainerRef`** (`React.RefObject<HTMLElement | null>`), **`disabled?: boolean`** (z. B. `isLoading`), **`onBusyChange?: (b: boolean) => void`** optional für Spinner.
- [ ] **`onClick` PNG:** async `toPng` → gleicher `fileBaseName` + `.png` → Download (Blob über `canvas`/`toBlob` oder Data-URL nach Spec — `toPng` liefert dataUrl, dann fetch-blob oder direkt `<a download href={dataUrl}>`).
- [ ] **`onClick` JSON:** `buildLinkGraphJsonPayload` mit **unfiltrierten** `pages` / `pageLinks` → `JSON.stringify(payload, null, 2)` → Download `application/json`.
- [ ] **`onClick` Markdown:** `buildLinkGraphMarkdown` → Download `text/markdown;charset=utf-8`.
- [ ] **Trigger-Button:** `aria-haspopup`, Zustand `aria-expanded` über Headless API.
- [ ] **Hinweis:** `title`-Tooltip oder `Menu`-Label/Unterzeile klein gedrückt (*PNG … · JSON …*) — entspricht Spec 2.1 (kurz).


---

## Task 4: `LinkGraphView.tsx` zusammenführen

- [ ] Deaktivierten **Export**-Button ersetzen durch **`<LinkGraphExportMenu>`** mit:
  - `pages` und `pageLinks` **aus den Hooks ohne Filterung** (`data` Roh — nicht `visiblePages`).
- [ ] **`disabled={isLoading}`** (oder wenn `flowContainerRef` nicht gemountet).
- [ ] State optional: **`exportMessage`** (`string | null`) 2–3 s nach erfolgreichem Export — **nicht** zwingend.

---

## Task 5: Tests (optional, empfohlen)

- [ ] `linkGraphExport.test.ts`: Sortierung Reihenfolge mit 2–3 Fixtures; Markdown-Zeilenanzahl === `page_links.length`; JSON keys vorhanden; Pipe in `anchor_text` bricht Tabellen-Spalten nicht mehr.

---

## Task 6: Roadmap / Abnahme

- [ ] `docs/ROADMAP_LinkGraph.md`: SP24 **Status** `[x]`, Log-Datum + Verweis auf diesen Plan.
- [ ] Manueller Test: Projekt mit ≥1 Seite und ≥1 Link — alle drei Downloads; gefilterten Graph prüfen: PNG ohne ausgeblendete Knoten; JSON enthält aber **alle** Pages/Links wenn DB mehr hat als Filter-Anzeige (Testdaten auf Setup abstellen).

---

## Git (nach Freigabe)

```bash
git add package.json package-lock.json src/lib/linkGraphExport.ts \
  src/components/link-graph/LinkGraphExportMenu.tsx \
  src/components/link-graph/LinkGraphView.tsx \
  docs/superpowers/plans/2026-04-29-sp24-link-graph-export.md \
  docs/ROADMAP_LinkGraph.md \
  ...
git commit -m "feat(link-graph): SP24 export PNG, JSON und Markdown"
```

---

## Bekannte Risiken

| Risiko | Mitigation |
|--------|------------|
| `html-to-image` + React Flow SVG | Weißer `backgroundColor`, ggf. `pixelRatio`; bei Totalausfall Fallback-Meldung |
| Große Graphen PNG sehr groß | Akzeptiert für SP24; SP25 kann Qualitätstemperatur erwähnen |
| Dropdown vs. Mobil | Headless Menu scrollt; Tailwind `max-h`/`overflow` für viele Items nicht nötig (3 Einträge) |
