# Design Spec: Link Graph Feature (SP16-SP25)

**Projekt:** SEO Workflow Platform  
**Erstellt:** 2026-04-23  
**Basis:** `docs/konzept/KONZEPT_Verlinkungsarchitektur_Visualisierung.md`

---

## Ueberblick

Erweiterung der bestehenden SPA um eine interaktive Verlinkungsarchitektur-Visualisierung. Content-Manager sehen alle Seiten eines Projekts als Nodes und alle internen Links als gerichtete Edges in einem React-Flow-Graphen.

Die Erweiterung ist in 10 Sub-Projekte (SP16-SP25) unterteilt, die sequenziell implementierbar sind. Die SPs bauen fachlich und technisch aufeinander auf; nicht jedes SP ist fuer sich allein releasebar.

---

## Architektur

### Einbindung in den bestehenden Stack

```text
Bestehend:   projects -> categories -> artifacts -> artifact_results
Neu:         projects -> pages -> page_links
```

- **Route:** `/projects/$projectId/link-graph` (neues TanStack Router File)
- **Hooks:** `usePages`, `usePageLinks` (TanStack Query, analog zu `useCategories`)
- **API-Client:** `apiClient.pages`, `apiClient.pageLinks`
- **Backend-Routen:** `/api/pages/*`, `/api/page-links/*` (Express, analog zu `categories`)
- **Migration:** `supabase/migrations/006_link_graph.sql`
- **Neue Libraries:** `@xyflow/react` (React Flow v12), `@dagrejs/dagre`

### Datenfluss

Der Link Graph folgt dem bestehenden App-Muster und greift nicht direkt aus React auf Supabase zu.

```text
Route / View
  -> TanStack Query Hooks
  -> apiClient
  -> Express API
  -> PostgreSQL / Supabase
```

- `usePages(projectId)` nutzt `GET /api/pages/by-project/:projectId`
- `usePageLinks(projectId)` nutzt `GET /api/page-links/by-project/:projectId`
- Mutationen fuer Pages und Links laufen ebenfalls ueber Express-Routen
- RLS bleibt als Datenbankschutz aktiv, ist aber nicht der primaere Frontend-Integrationspunkt

### Schichtung

```text
Route (link-graph.tsx)
  -> LinkGraphView
       -> FilterSidebar       (left)
       -> GraphCanvas         (center, React Flow)
       -> NodeDetailsPanel    (right, bei Klick)
       -> EdgeDetailPopup     (overlay, bei Klick)
```

GraphCanvas nutzt folgende Komponenten:

- `HubNode`
- `SpokeNode`
- `BlogNode`

---

## Datenmodell

### Tabelle `pages`

```sql
CREATE TABLE pages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,
  name               VARCHAR(255) NOT NULL,
  type               VARCHAR(50) NOT NULL CHECK (type IN ('hub', 'spoke', 'blog')),
  status             VARCHAR(50) NOT NULL DEFAULT 'planned'
                                   CHECK (status IN ('published', 'draft', 'planned')),
  url_slug           VARCHAR(255),
  markdown_file_path TEXT,
  word_count         INT DEFAULT 0,
  position_x         FLOAT,
  position_y         FLOAT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabelle `page_links`

```sql
CREATE TABLE page_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_page_id      UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  to_page_id        UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  anchor_text       VARCHAR(500),
  context_sentence  TEXT,
  placement         VARCHAR(100),
  line_number_start INT,
  line_number_end   INT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_page_id, to_page_id, anchor_text, line_number_start, line_number_end)
);
```

### RLS

Beide Tabellen folgen dem bestehenden Pattern:

```sql
EXISTS (
  SELECT 1
  FROM projects p
  WHERE p.id = project_id
    AND p.user_id = auth.uid()
)
```

### Modell-Entscheidungen fuer MVP

- `category_id` bleibt optional, damit Pages weiter einem bestehenden Kategorie-/Phasenkontext zugeordnet werden koennen.
- Phase wird nicht direkt auf `pages` gespeichert, sondern aus `pages.category_id -> categories -> artifacts.phase` abgeleitet.
- `page_links` modelliert Link-Instanzen, nicht nur aggregierte Beziehungen.
- Mehrere identische Anchors zwischen denselben Seiten sind erlaubt, solange sie an unterschiedlicher Position im Dokument vorkommen.
- Die visuelle Edge-Staerke wird im Frontend aus der Anzahl der Link-Instanzen pro `(from_page_id, to_page_id)` aggregiert.

---

## Dateiverhalten und Editor-Aktion

Fuer MVP bedeutet "Im Editor oeffnen" keine native Desktop-Editor-Integration und keinen VS-Code-Deep-Link.

- Die Aktion oeffnet eine interne Datei-/Content-Ansicht in der App.
- Basis ist `markdown_file_path` auf Supabase Storage.
- Wenn `line_number_start` vorhanden ist, springt die App an die passende Stelle oder markiert den naechstliegenden Abschnitt.
- Wenn keine Datei vorhanden ist, ist die Aktion disabled und zeigt einen klaren Hinweis.

---

## Filterlogik

- **Typ:** filtert direkt auf `pages.type`
- **Status:** filtert direkt auf `pages.status`
- **Phase:** filtert ueber `pages.category_id -> categories -> artifacts.phase`
- **Verwaiste Seiten:** `incoming_edge_count === 0`
- **Tote Enden:** `outgoing_edge_count === 0`

Wenn eine Seite keine `category_id` hat, erscheint sie in keinem Phase-Filter, bleibt aber in den anderen Filtern sichtbar.

---

## API-Skizze

Minimaler MVP-Scope fuer neue Endpoints:

- `GET /api/pages/by-project/:projectId`
- `POST /api/pages`
- `PUT /api/pages/:id`
- `DELETE /api/pages/:id`
- `GET /api/page-links/by-project/:projectId`
- `POST /api/page-links`
- `PUT /api/page-links/:id`
- `DELETE /api/page-links/:id`

Antwortformat analog zu bestehenden Resource-Routen:

- flache DB-Zeilen
- Ownership-Pruefung im Express-Layer
- serverseitige Sortierung, wo fuer die UI sinnvoll

---

## Sub-Projekte

### SP16 - Datenmodell (~1h)

Migration `006_link_graph.sql`, TypeScript Types, RLS Policies, optionale `category_id`, Unique-Constraint fuer Link-Instanzen.

### SP17 - Leere Graph-View (~2h)

Route `/projects/$projectId/link-graph`, React Flow einbinden, Empty State, Topbar (Breadcrumb + Export-Button-Platzhalter), linke Filter-Sidebar (noch nicht funktional), API-Client-Stubs und Express-Routen anlegen.

### SP18 - Nodes und Edges rendern (~4h)

`usePages` + `usePageLinks` Hooks, Custom Node-Komponenten (Hub/Spoke/Blog), Dagre-Auto-Layout, gerichtete Edges mit Staerke (Liniendicke = Anzahl aggregierter Link-Instanzen).

### SP19 - Node-Details-Panel (~3h)

`NodeDetailsPanel.tsx` rechts: Name, Typ, Status, Wortcount, Kategorie-/Phase-Kontext, Incoming/Outgoing Links mit Anchor-Texten, Aktionen (Markdown in App oeffnen, Bearbeiten, Loeschen).

### SP20 - Edge-Details-Popup (~2h)

Klick auf Edge -> Popup: Von -> Nach, Anchor-Text, Kontextsatz, Platzierung, Zeile, Button "Im Editor oeffnen" (interne Content-Ansicht). Bearbeiten-Modal.

### SP21 - Filter und Suche (~3h)

Filter-State, Multi-Select Typ (Hub/Spoke/Blog) + Status + Phase, Toggles "Verwaiste Seiten" / "Tote Enden", Suche in Topbar (Node hervorheben + hinzoomen).

### SP22 - Markdown-Upload und Parsing (~5h)

Drag & Drop Zone, Upload nach Supabase Storage, `remark`-Parser (Title + Links + Zeilennummer), Auto-Matching URLs -> Nodes, Geplant-Node wenn kein Match, Graph-Re-Render.

### SP23 - Manuell anlegen (~3h)

`AddPageModal.tsx` (Name, Typ, URL-Slug, optionale Kategorie) + `AddLinkModal.tsx` (Von, Nach, Anchor, Kontext, Platzierung), DB-Insert, Graph-Re-Render.

### SP24 - Export (~2h)

PNG-Export (React Flow Viewport + Canvas), JSON-Export (Nodes + Edges), Markdown-Report (Tabelle), Download-Buttons in Topbar.

### SP25 - Polish (~2h)

Zoom-Controls (+/-), Fit-to-Screen-Button, Loading-States, Error-Handling (unbekannte URLs), Fade-In-Animationen, Hover-Tooltips.

---

## Abhaengigkeiten

- **SP16 -> SP17:** Datenmodell und Typen muessen vor der Route stehen.
- **SP17 -> SP18:** Rendering braucht funktionierende Route und API-Anbindung.
- **SP18 -> SP19/SP20/SP21/SP23:** Details, Filter und Mutationen bauen auf geladenen Nodes/Edges auf.
- **SP18 -> SP22:** Parsing kann neue Nodes/Edges erst sinnvoll mergen, wenn Grundrendering existiert.
- **SP18 -> SP24:** JSON-/Markdown-Export brauchen reale Graph-Daten; PNG-Export braucht mindestens den Graph-Canvas.
- **SP19/SP20/SP21 -> SP25:** Polish setzt bestehende Interaktionen voraus.

---

## Node-Styles (React Flow Custom Nodes)

| Typ | Groesse | Farbe | Gestrichelt wenn Geplant |
|-----|---------|-------|--------------------------|
| Hub | 60px | Blau | ja |
| Spoke | 50px | Gruen | ja |
| Blog | 50px | Gelb | ja |

Edge: Standard = Grau 2px, Hover = Accent-Blau 3px, Mehrfach-Link = dicker Pfeil.

---

## Neue Libraries

```bash
npm install @xyflow/react @dagrejs/dagre remark remark-parse unist-util-visit
```

`@xyflow/react` ist der aktuelle Package-Name fuer React Flow v12.

---

## Gesamt-Aufwand

10 SP x ca. 2.7h = **ca. 27h Entwicklungszeit** (exkl. Testing/Bugfixes)
