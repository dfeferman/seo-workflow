# Design Spec: SP24 – Link-Graph-Export (PNG, JSON, Markdown)

**Stand:** 2026-04-29  
**Übergeordnet:** `docs/superpowers/specs/2026-04-23-link-graph-design.md`, `docs/ROADMAP_LinkGraph.md`  
**Status:** zur Implementierung freigegeben (Auswahl **B** + Dropdown **Variante 1**)

---

## 1 Ziel und Nutzen

Nutzer können auf der Route **`/projects/$projectId/link-graph`** aus der Topbar Dokumente erzeugen:

| Export | Zweck |
|--------|--------|
| **PNG** | Visuelle Dokumentation des Graphen **wie aktuell dargestellt** |
| **JSON** | Maschinenlesbare **Vollsicherung** der Projekt-Daten (`pages`, `page_links`) |
| **Markdown** | Menschenlesbare **Link-Tabelle** für Reviews, Nachverfolgbarkeit oder Weitergabe |

Alle Exporte laufen **nur clientseitig** (TanStack Query liefert die Daten bereits); **keine neuen API-Endpunkte** für SP24.

---

## 2 Festgelegte Produktentscheidungen

### 2.1 Datenlogik (Auswahl **B**)

| Exporttyp | Datenbasis | Begründung |
|-----------|------------|------------|
| **PNG** | Aktuelle **Darstellung im React-Flow-Bereich** (Viewport, Zoom, wie Nutzer sieht). Filter wirken auf die **sichtbaren Knoten/Kanten**. | Konsistent mit dem Erwarteten „Screenshot vom Graph“. |
| **JSON** | **Vollständiges Projekt**: alle `pages` und alle `page_links` aus dem geladenen Datenbestand (**ohne** Anwendung der Sidebar-Filter). | Backup und externe Tools sollen immer vollständige Daten sehen; Filter sind eine UI-Ansicht, nicht implizites Export-Sieb. |
| **Markdown-Tabelle** | Gleiche Datenbasis wie **JSON** bezüglich Links: **jede Zeile `page_links`**, alle Links des Projekts (**unfiltriert**). Auflösung **Von**/**Nach** über Seiten-Namen (über `pages`). | SEO-/Redaktions-Übersicht ohne Risk „vergessene Filter“. |

**UI-Hinweis (kurz, einmalig sichtbar):** Im Export-Menü oder Tooltip z. B.:  
*„PNG zeigt die aktuelle Ansicht · JSON und Markdown enthalten alle Seiten und Links dieses Projekts.“*

### 2.2 Topbar (Dropdown **Variante 1**)

Der bisherige deaktivierte Button **„Export“** wird ein **einzelner** aktiv geschalteter Button mit **Dropdown** (Desktop: Hover oder Klick konsistent zum restlichen UI):

1. **Grafik exportieren (PNG)**  
2. **Daten exportieren (JSON)**  
3. **Link-Tabelle exportieren (Markdown)**

Auswahl löst direkt den Download aus (Dateiname siehe Abschnitt 7). Optional: gleiche Einträge mit Icons (Foto/Dokument/Tabelle); nicht zwingend SP24.

**Barrierefreiheit:** Menü über Tastatur schließbar, `aria-expanded`/`aria-haspopup` am Trigger.

---

## 3 Nicht-Ziele (SP24)

- Kein **Re-Import** von JSON oder Markdown.
- Keine **Persistenz von Layout-Koordinaten** im JSON (Felder `position_*` in `PageRow` dürfen serialisiert werden wie von der API, aber kein eigener „Graph-Layout-Export“-Modus).
- Kein **Serverseitiger** Export und kein E-Mail-Versand.
- **Gefilterten** JSON/Markdown-Export als Alternative: **nicht** Bestandteil von SP24 (YAGNI).

---

## 4 PNG (technische Leitplanken)

- Quelle: der **React-Flow-Containernode** (Pane), der den Graphen rendert – **nicht** die komplette App inkl. Topbar/Sidebar, außer Produkt entscheidet später explizit anders.
- Rasterisierung typisch per **`html-to-image`** (oder gleichwertiges, mit `@xyflow/react`-Projekten übliches Tool); Implementierungsplan nennt die konkrete Dependency und `image/png`-Blob → `<a download>`.
- Nach Export: ggf. vorübergehendes **„Exportiert …“** ohne Modal-Pflicht (Toast oder kurzer Text).
- Fehler (CORS, fehlendes Dom-Element, Timeout): verständliche **deutsche** Meldung.

---

## 5 JSON (Schema, minimal)

Ein Objekt pro Download:

```json
{
  "exported_at": "ISO-8601-Zeichenkette",
  "project_id": "uuid",
  "project_name": "Anzeigename wie in der Link-Graph-View",
  "pages": [ /* PageRow[] wie aus usePages */ ],
  "page_links": [ /* PageLinkRow[] wie aus usePageLinks */ ]
}
```

- Reihenfolge der Arrays: stabil **sortiert** empfohlen (`pages` z. B. nach `name` oder `created_at`, `page_links` nach `from_page_id` dann `to_page_id` dann `id`), damit Diff/Codereview einfacher wird.
- **Vollständigkeit:** alle Zeilen des Projekts, unabhängig von Filtern.

---

## 6 Markdown (Tabelle)

- **Eine** `.md`-Datei mit kurzer Kopfzeile (Projektname, Exportdatum).
- **Markdown-Tabelle**: eine Zeile **pro Datensatz** in `page_links` (keine Aggregation auf Kantenebene).

| Spalte (Überschrift deutsch) | Quelle |
|------------------------------|--------|
| **Von** | `name` der Quellseite (`from_page_id`) |
| **Nach** | `name` der Zielseite (`to_page_id`) |
| **URL Quelle** | optional: `url_slug` oder abgeleiteter Pfad der Quellseite, wenn sinnvoll; sonst `--` |
| **URL Ziel** | optional analog; sonst `--` |
| **Anker** | `anchor_text` |
| **Kontext** | `context_sentence` |
| **Platzierung** | `placement` |
| **Zeile von** | `line_number_start` |
| **Zeile bis** | `line_number_end` |

- Fehlende Werte als leere Zelle oder `--`, einheitlich im Implementierungsplan festlegen.

---

## 7 Dateinamen

Vorschlag für alle drei Formate:

`link-graph-{project_id_kurz_oder_slug}-{yyyy-mm-dd}.{png|json|md}`

Kollisionen am selben Tag: optional Suffix `_2` oder Uhrzeit in ISO – nur wenn in der ersten Implementierung ohne großen Aufwand machbar.

---

## 8 Abgrenzung SP25

Feintuning (Zoom-Buttons extra, Skeletons etc.) gehört **`docs/superpowers/specs`** SP25 – nicht Teil dieser Export-Spec.

---

## 9 Akzeptanzkriterien

- Dropdown **Export** aktiv; drei Einträge; PNG/JSON/.md laden im Browser ohne 500 vom eigenen Backend.
- JSON enthält sämtliche `pages`/`page_links` des Projekts (laut Query), unabhängig von Filtern.
- PNG zeigt den Graphenbereich entsprechend **aktueller** Zoom-/Pan-/Filterdarstellung auf dem Canvas.
- Markdown-Tabelle: Zeilenzahl = Anzahl Zeilen `page_links` (bei leerem Projekt leere Tabelle oder Hinweiszeile spezifikationskonform im Plan festlegen).
- Filter-Hinweistext wirkt für Nutzer nicht widersprüchlich zur tatsächlichen Exportlogik.

---

## 10 Self-Review

- Keine Platzhalter offen für SP24-Core.
- Konsistent mit Roadmap (PNG, strukturiertes JSON, Markdown-Tabelle).
- Scope: nur Client-Export, keine neue API.

