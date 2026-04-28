# Design Spec: SP23 – Seite und Link manuell anlegen und bearbeiten

**Projekt:** SEO Workflow Platform  
**Erstellt:** 2026-04-29  
**Basis:** Brainstorming (Sidebar B, POST+PUT ohne DELETE, Slug-Regeln, Statuswahl im Modal, API-Konvention wie `categories`)  
**Uebergeordnet:** `docs/superpowers/specs/2026-04-23-link-graph-design.md`, `docs/ROADMAP_LinkGraph.md`

---

## Ziel

Nutzer koennen im Link Graph (**`/projects/$projectId/link-graph`**) **Seiten** und **Links** manuell **anlegen** und **bearbeiten** (Persistenz PostgreSQL ueber Express). **Kein Loeschen** von Seiten oder Links im Scope von SP23.

---

## UX

### Platzierung

- In der **linken Filter-Sidebar** ein eigener Bereich **„Graph bearbeiten“** (Arbeitstitel), darin zwei Hauptaktionen:
  - **„Seite anlegen“** oeffnet das Seiten-Modal (Create).
  - **„Link anlegen“** oeffnet das Link-Modal (Create).

### Modal: Seite (`PageFormModal` oder `AddPageModal` mit Modi)

Felder fuer **Neuanlage (Create)**:

| Feld | Pflicht | Hinweis |
|------|---------|---------|
| Name | Ja | Max. wie DB (`VARCHAR(255)`) |
| Typ | Ja | `hub` / `spoke` / `blog` |
| `url_slug` | Ja | Nach Normalisierung (trim); **eindeutig im Projekt** (siehe Validierung) |
| Status | Ja | `published` / `draft` / `planned` — Nutzer waehlt explizit |
| Kategorie | Nein | Dropdown: nur **Kategorien dieses Projekts**; leer = `category_id NULL` |

**Bearbeiten (Update):** gleiches Formular im Modus **Edit** (vorbefuellt), **inkl.** aenderbare Felder wie oben; **`markdown_file_path`** siehe unten (kein willkuerliches Leeren in SP23).

### Modal: Link (`AddLinkModal` / Bearbeiten)

- **Von-Seite** und **Ziel-Seite:** Auswahl aus allen **`pages`** des aktuellen **Projekts** (Liste oder Suche).
- **Anchor-Text**, optional **Kontextsatz**, **Platzierung**, **Zeilen** (`line_number_start` / `line_number_end`) — wie DB-Nullable erlaubt; sinnvolle Defaults (z. B. Zeilen `NULL`, wenn nicht angegeben).

**Selbst-Link** (`from_page_id === to_page_id`) ist **nicht** erlaubt (400).

### Nach dem Speichern

- TanStack Query: **`invalidateQueries`** fuer `['pages', projectId]` und `['page-links', projectId]`.
- Neue/aktualisierte Knoten erscheinen im Graph, wenn sie den **aktuellen Filtern** entsprechen; kein automatisches Zuruecksetzen der Filter in SP23 (optionaler Hinweistext SPAETER / SP25).

---

## Backend: API-Konvention

Analog zu bestehendem Muster (**`POST /api/categories`** mit `project_id` im Body):

| Methode | Pfad | Zweck |
|---------|------|-------|
| `POST` | `/api/pages` | Neue Seite; Body enthaelt `project_id` und Seitenfelder |
| `PUT` | `/api/pages/:id` | Seite aktualisieren |
| `POST` | `/api/page-links` | Neuen Link; Body enthaelt `project_id`, `from_page_id`, `to_page_id`, ... |
| `PUT` | `/api/page-links/:id` | Link-Instanz aktualisieren |

**Ownership:** Jede Schreiboperation prueft, dass das referenzierte **Projekt** dem authentifizierten Nutzer gehoert und alle referenzierten **`pages`** zu **diesem** `project_id` gehoeren.

**Antwort:** Immer wie bestehende Routen: JSON-Zeile (`RETURNING *` bzw. SELECT nach Update), Fehler als `{ error: string }` mit passendem HTTP-Status.

---

## Validierung und Geschaeftsregeln

### `url_slug` (Seiten)

- **Create:** **Pflicht**; nach Normalisierung (mindestens `trim`).
- **Eindeutigkeit:** Innerhalb eines **Projekts** darf derselbe Slug nicht zweimal vergeben werden (ausgenommen die **eigene** Zeile beim **Update**). Umsetzung in **SP23:** **Anwendungslogik** (SELECT vor INSERT/UPDATE auf Konflikt). Optional spaeter: DB-Partial-Unique-Index `(project_id, lower(url_slug))` — nicht zwingend SP23.
- Bei Konflikt: **400** mit klarer Meldung (keinPflicht-Spiel mit 409 ausser explizit gewuenscht).

### `category_id`

- Wenn gesetzt: Die Kategorie muss existieren und **`categories.project_id`** muss gleich **`pages.project_id`** der Seite sein.

### Links

- **`project_id`** im Body muss mit den Seiten konsistent sein: `from_page_id` und `to_page_id` referenzieren **`pages`** mit **diesem** `project_id`.
- **Keine Selbstreferenz:** `from_page_id !== to_page_id`.
- **Unique-Constraint** der DB auf `(from_page_id, to_page_id, anchor_text, line_number_start, line_number_end)`: Bei Verstoss PostgreSQL-Fehler abfangen und als **400** mit verstaendlicher Meldung (oder 409, einheitlich waehlen und im Implementierungsplan festhalten).

### `markdown_file_path` bei `PUT pages`

- In SP23: **Pfad nicht absichtlich auf `NULL` setzen** ueber diese API (kein „Markdown-Verknuepfung entfernen“-Feature). Aenderungen nur an den explizit freigegebenen Feldern; leeres/spaeteres „Clear“-Verhalten **out of scope**.

---

## Bestehende UI verdrahten

- **`LinkEditModal`:** Speichern an **`PUT /api/page-links/:id`** anbinden (bisher ohne Persistenz).
- **Node Details / Edge Details:** Aktionsflaechen „Bearbeiten“ dort, wo bereits UI vorhanden ist, **Edit-Modals** oeffnen bzw. mit gleichen Formularen wie Sidebar — **Minimalanforderung SP23:** **Link-Bearbeitung** aus dem bestehenden Link-Edit-Modal ist funktional; **Seiten-Bearbeitung** ueber **`PageFormModal` im Edit-Modus** erreichbar (Sidebar oder „Seite bearbeiten“ aus dem Panel).

---

## Fehlerbehandlung

- **400** Validierung (fehlende Pflichtfelder, Slug-Konflikt, Selbstlink, falscher Projektbezug).
- **403/404** wenn Ressource nicht existiert oder nicht dem Nutzer gehoert.
- Kein DELETE in SP23 — Buttons „Loeschen“ bleiben deaktiviert oder ausgeblendet bis spaeterem Ticket.

---

## Tests (Mindestempfehlung)

- Server: Slug-Konflikt bei zweitem INSERT; UPDATE Slug ohne Konflikt mit eigener Id; Link mit gleichem Projekt; Selbstlink 400.
- Optional: Frontend-Smoke manuell laut RUNBOOK.

---

## Abgrenzung

| In SP23 | Nicht in SP23 |
|---------|----------------|
| POST/PUT pages + page-links | DELETE |
| Manuelle Pflege Felder oben | Leeren von `markdown_file_path` per API |
| Sidebar + Modals + bestehende Edit-Shells | Export (SP24), Polish (SP25) |

---

## Self-Review

- [x] Keine TBD ohne Entscheidung; optionale DB-Index-Erweiterung klar als „spaeter“ markiert.
- [x] Konsistent mit Postgres-Schema `006_link_graph.sql` und bestehender Auth.
- [x] Scope: ein Release-Block; Delete bewusst ausgeschlossen.
- [x] `markdown_file_path`-Regel explizit, keine widersprüchliche „PUT alles“-Formulierung.
