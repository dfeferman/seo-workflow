# Konzept: Interaktive Verlinkungsarchitektur-Visualisierung
**Projekt:** SEO Workflow Platform – Link Graph Feature  
**Version:** 1.0  
**Erstellt:** 23. April 2026

---

## 1. Problem & Ziel

### Problem
SEO-Content-Ersteller verlieren bei wachsenden Content-Clustern (Hub + Unterkategorien + Blog) den Überblick über:
- **Welche Seiten existieren** (Hub, Spokes, Blog-Artikel)
- **Wo Links gesetzt sind** (von Seite X zu Seite Y)
- **Welche Seiten noch fehlen** (geplante Blog-Artikel ohne Content)
- **Wo Links fehlen** (Unterkategorie ohne Link zum Hub)
- **Exakte Linkposition** (H2-3, Footer, FAQ-Block)

**Konsequenz**: Manuelles Nachschlagen in Markdown-Files, Excel-Sheets oder Notizen → Zeitverlust, Inkonsistenzen, fehlende Links.

**Hinweis**: Ratgeber = Blog (kein separater Content-Typ)

### Ziel
Eine **interaktive Graph-Visualisierung** in der SEO Workflow Platform, die:
1. **Alle Seiten als Nodes** zeigt (Hub, Unterkategorien, Blog)
2. **Links als Edges** darstellt (gerichtet: A → B)
3. **Fehlende Content-Seiten** markiert (geplant aber noch nicht geschrieben)
4. **Link-Details** anzeigt (Anchor-Text, Kontextsatz, Platzierung)
5. **Filterbar** ist (nach Phase, Type, Status)
6. **Klickbar** ist (Node → öffnet Markdown-Datei im Editor)

**Content-Typen**: Hub, Spoke, Blog (Ratgeber sind Blog-Artikel)

---

## 2. Zielgruppe & Use Cases

### Primäre Nutzer
- **SEO-Content-Manager** (1–5 Personen pro Projekt)
- **Content-Writer** (arbeiten an einzelnen Seiten)
- **Freelancer** (externe Autoren, die Kontext brauchen)

### Typische Use Cases

#### UC1: "Welche Blog-Artikel fehlen noch?"
**User**: SEO-Manager  
**Szenario**: Plant Content-Roadmap für Q2  
**Aktion**: Öffnet Link Graph → filtert nach "Blog" + Status "Geplant"  
**Ergebnis**: Sieht 3 fehlende Blog-Artikel (VAH vs. RKI, KRINKO-Anleitung, HACCP-Guide)

#### UC2: "Welche Seite linkt zu meinem neuen Blog-Artikel?"
**User**: Content-Writer  
**Szenario**: Hat Blog "Coronavirus – Welches Desinfektionsmittel?" geschrieben  
**Aktion**: Öffnet Link Graph → klickt auf Blog-Node  
**Ergebnis**: Sieht eingehende Links von Hub (2x) + UK Händedesinfektion (1x) + UK Flächendesinfektion (1x)

#### UC3: "Welche Links hat die UK Händedesinfektion?"
**User**: SEO-Manager  
**Szenario**: Will Cross-Links zwischen UKs prüfen  
**Aktion**: Klickt auf Node "UK Händedesinfektion"  
**Ergebnis**: Panel zeigt:
- Ausgehende Links: Hub (1x), UK Hautdesinfektion (1x), Ratgeber "6 Schritte" (1x)
- Eingehende Links: Hub (2x), Ratgeber "Coronavirus" (1x)

#### UC4: "Wo genau ist der Link im Text?"
**User**: Content-Writer  
**Szenario**: Muss Link von Hub → UK Händedesinfektion aktualisieren  
**Aktion**: Klickt auf Edge (Hub → UK Händedesinfektion)  
**Ergebnis**: Popup zeigt:
- **Anchor-Text**: "Händedesinfektionsmittel kaufen"
- **Kontextsatz**: "Für die hygienische und chirurgische Händedesinfektion..."
- **Platzierung**: H2-1 (Teaserblock, Zeile 42–45)
- **Button**: "Im Editor öffnen" → Springt zu Zeile 42 in `hub-desinfektionsmittel.md`

#### UC5: "Welche Seiten haben KEINE eingehenden Links?"
**User**: SEO-Manager  
**Szenario**: Will verwaiste Seiten finden  
**Aktion**: Öffnet Link Graph → aktiviert Filter "Verwaiste Seiten" (Nodes ohne Incoming Edges)  
**Ergebnis**: 1 Node leuchtet rot auf → UK Saugrohrdesinfektion (neu angelegt, aber noch nicht verlinkt)

**Hinweis**: Blog-Artikel (früher "Ratgeber") sind Teil des "Blog"-Filters

---

## 3. Funktionale Anforderungen (Must-haves)

### F1: Graph-Visualisierung
- **Nodes**: Jede Content-Seite = 1 Node
  - **Hub**: Großer Node (60px), Blau
  - **Unterkategorie (Spoke)**: Mittlerer Node (50px), Grün
  - **Blog**: Mittlerer Node (50px), Gelb (inkl. Anleitungen/Ratgeber)
  - **Geplant** (noch kein Markdown-File): Gestrichelte Outline, Grau
- **Edges**: Gerichtete Pfeile (A → B)
  - **Stärke**: Dicker Pfeil = mehr Links (z.B. Hub → UK: 2 Links = doppelter Pfeil)
  - **Farbe**: Standard = Grau, Hover = Accent-Blau
- **Layout**: Force-Directed Graph (Nodes ziehen sich an, Edges bilden Cluster)
- **Zoom & Pan**: Mausrad-Zoom, Drag-to-Pan

### F2: Node-Details (Klick)
Klick auf Node → Rechtes Panel öffnet:
- **Name**: z.B. "UK Händedesinfektion"
- **Typ**: Unterkategorie
- **Status**: ✅ Veröffentlicht / 🔄 In Arbeit / 📝 Geplant
- **Wortcount**: 1.450 Wörter
- **Eingehende Links** (Incoming):
  - Hub (2x): "Händedesinfektionsmittel kaufen", "6 Schritte..."
  - Ratgeber Coronavirus (1x): "Viruzide Händedesinfektionsmittel"
- **Ausgehende Links** (Outgoing):
  - Hub (1x): "Alle Desinfektionsmittel kaufen"
  - UK Hautdesinfektion (1x): "Unterschied Haut- vs. Händedesinfektion"
  - Ratgeber "6 Schritte" (1x): "Anleitung Händedesinfektion"
- **Aktionen**:
  - 📄 Markdown-Datei öffnen
  - ✎ Seite bearbeiten (öffnet Workflow)
  - 🗑 Seite löschen

### F3: Edge-Details (Klick)
Klick auf Edge (Pfeil) → Tooltip/Popup zeigt:
- **Von**: Hub → **Nach**: UK Händedesinfektion
- **Anchor-Text**: "Händedesinfektionsmittel kaufen"
- **Kontextsatz**: "Für die hygienische und chirurgische Händedesinfektion..."
- **Platzierung**: H2-1 (Teaserblock)
- **Zeile im File**: Zeile 42–45 in `hub-desinfektionsmittel.md`
- **Aktion**: Button "Im Editor öffnen" → Öffnet File + scrollt zu Zeile 42

### F4: Filter & Suche
**Filter** (Sidebar links):
- **Nach Typ**: Hub / Unterkategorien / Blog (Multi-Select)
- **Nach Status**: Veröffentlicht / In Arbeit / Geplant
- **Nach Phase**: A / B / C / D / E / F (falls Seite einem Artefakt zugeordnet ist)
- **Verwaiste Seiten**: Toggle (zeigt nur Nodes ohne Incoming Links)
- **Tote Enden**: Toggle (zeigt nur Nodes ohne Outgoing Links)

**Suche** (Topbar):
- Suche nach Seiten-Name → Hebt Node hervor + zoomt hin

**Hinweis**: "Blog" umfasst sowohl News-Artikel als auch Anleitungen/Ratgeber

### F5: Markdown-Upload & Parsing
User kann Markdown-Dateien hochladen:
1. **Drag & Drop** von `.md`-Files in Graph-View
2. **System parst** Markdown:
   - Extrahiert `# Title` → Node-Name
   - Findet alle Links `[Anchor-Text](url)` → Edges
   - Speichert Link-Position (Zeile, Heading-Level)
3. **Auto-Matching**:
   - Wenn URL = `/handdesinfektion` → matched zu Node "UK Händedesinfektion"
   - Wenn kein Match → erstellt "Geplant"-Node

### F6: Export
- **PNG-Export**: Graph als Bild speichern
- **JSON-Export**: Graph-Daten als JSON (für Backup/Import)
- **Markdown-Report**: Tabellarische Übersicht aller Links (wie im B2-Artefakt)

---

## 4. Nice-to-haves (Post-MVP)

### N1: Link-Stärke-Analyse
- **PageRank-ähnlich**: Welche Seiten haben die meiste "Link-Power"?
- **Farbcodierung**: Nodes mit hoher Zentralität = dunkler

### N2: Link-Vorschläge (AI)
- System analysiert Themen (z.B. via Embeddings)
- Schlägt fehlende Links vor: "UK Händedesinfektion sollte zu Ratgeber 'VAH vs. RKI' linken"

### N3: Broken-Link-Detection
- Prüft, ob verlinkte URLs existieren
- Markiert tote Links rot

### N4: Multi-Projekt-View
- Graph über mehrere Projekte hinweg (z.B. "Alle Medizinprodukte-Shops")

### N5: Collaborative Editing
- Mehrere User können gleichzeitig Graph bearbeiten (Realtime-Updates via Supabase)

---

## 5. Datenmodell

### Neue Tabelle: `pages`
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- Optional: Zuordnung zu Kategorie
  
  -- Metadaten
  name VARCHAR(255) NOT NULL,                    -- "UK Händedesinfektion"
  type VARCHAR(50) NOT NULL,                     -- 'hub', 'spoke', 'blog'
  status VARCHAR(50) DEFAULT 'planned',          -- 'published', 'draft', 'planned'
  url_slug VARCHAR(255),                         -- '/handdesinfektion'
  
  -- Content
  markdown_file_path TEXT,                       -- z.B. 'uploads/handdesinfektion.md'
  word_count INT DEFAULT 0,
  
  -- Visualisierung
  position_x FLOAT,                              -- Graph-Position (für persistentes Layout)
  position_y FLOAT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pages_project_id ON pages(project_id);
CREATE INDEX idx_pages_type ON pages(type);

-- WICHTIG: type = 'hub' | 'spoke' | 'blog'
-- Ratgeber sind Blog-Artikel (type = 'blog')
```

### Neue Tabelle: `page_links`
```sql
CREATE TABLE page_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Link-Relation
  from_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  to_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  
  -- Link-Details
  anchor_text VARCHAR(500),                      -- "Händedesinfektionsmittel kaufen"
  context_sentence TEXT,                         -- Kompletter Satz mit Link
  placement VARCHAR(100),                        -- 'h2-1-teaserblock', 'h2-3-content', 'faq-block'
  line_number_start INT,                         -- Zeile 42
  line_number_end INT,                           -- Zeile 45
  
  -- Metadaten
  link_purpose VARCHAR(100),                     -- 'seo', 'ux', 'conversion'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_page_id, to_page_id, anchor_text)  -- Verhindert doppelte Links
);

CREATE INDEX idx_page_links_from ON page_links(from_page_id);
CREATE INDEX idx_page_links_to ON page_links(to_page_id);
```

---

## 6. Tech Stack

### Frontend
**Bestehender Stack** (aus Implementation Guide):
- React 18 + TypeScript
- Vite
- Tailwind CSS

**Neue Libraries für Graph**:
- **React Flow** (https://reactflow.dev)
  - Warum: Beste React-Library für interaktive Graphs
  - Features: Drag & Drop, Zoom, Pan, Custom Nodes, Edges
  - Alternative: D3.js (zu low-level, mehr Arbeit)
- **Dagre** (Graph-Layout-Algorithmus)
  - Warum: Force-Directed Layout für hierarchische Graphs
  - Integration: Via `@dagrejs/dagre`

### Backend
**Bestehender Stack**:
- Node.js + Express
- Supabase (PostgreSQL)

**Neue Features**:
- **Markdown-Parser**: `remark` + `remark-parse` (AST-basiert)
  - Extrahiert Links + Position
- **File-Upload**: Supabase Storage (für .md-Files)

### Deployment
- Wie bisher: Frontend auf Vercel/Netlify, Backend auf Supabase

---

## 7. User Flow (MVP)

### Flow 1: Erste Nutzung (Leerer Graph)
1. User navigiert zu `/projects/:projectId/link-graph`
2. **Leerer Graph** wird angezeigt (Placeholder: "Noch keine Seiten vorhanden")
3. User klickt **"+ Seite hinzufügen"** oder **"Markdown hochladen"**
4. **Option A**: Manuell anlegen
   - Modal: Name, Typ (Hub/Spoke/Blog/Ratgeber), URL-Slug
   - Speichern → neuer Node erscheint
5. **Option B**: Markdown hochladen
   - Drag & Drop von `hub-desinfektionsmittel.md`
   - System parst Markdown → erstellt Node + Edges
6. Graph zeigt ersten Node

### Flow 2: Links hinzufügen
1. User klickt auf Node "Hub"
2. Rechtes Panel öffnet → Button **"+ Link hinzufügen"**
3. Modal:
   - **Zu welcher Seite?** → Dropdown (alle anderen Nodes)
   - **Anchor-Text**: Input
   - **Kontextsatz**: Textarea
   - **Platzierung**: Dropdown (H2-1, H2-2, FAQ, Footer)
4. Speichern → neuer Edge erscheint

### Flow 3: Markdown hochladen (Auto-Linking)
1. User uploaded `uk-handdesinfektion.md` mit folgendem Inhalt:
   ```markdown
   # Händedesinfektionsmittel kaufen
   
   ## Übersicht
   Zurück zu [allen Desinfektionsmitteln](/hub).
   
   ## Verwandte Produkte
   Siehe auch [Hautdesinfektion](/hautdesinfektion).
   ```
2. System parst:
   - Node "UK Händedesinfektion" erstellt
   - Edge zu "Hub" (Anchor: "allen Desinfektionsmitteln", Zeile 4)
   - Edge zu "UK Hautdesinfektion" (Anchor: "Hautdesinfektion", Zeile 7)
     - Falls "UK Hautdesinfektion" noch nicht existiert → erstellt "Geplant"-Node
3. Graph updated automatisch

### Flow 4: Link bearbeiten
1. User klickt auf Edge (Hub → UK Händedesinfektion)
2. Popup zeigt Details
3. Button **"Bearbeiten"**
4. Modal: Anchor-Text, Kontextsatz, Platzierung editierbar
5. Speichern → Edge updated

### Flow 5: Fehlende Seiten finden
1. User aktiviert Filter **"Geplant"**
2. Graph zeigt nur gestrichelte Nodes (noch kein Content)
3. User klickt auf Node "Ratgeber VAH vs. RKI"
4. Panel zeigt:
   - **Status**: Geplant
   - **Eingehende Links**: Hub (1x), UK Händedesinfektion (1x)
   - **Button**: "Content erstellen" → öffnet Workflow für neuen Ratgeber

---

## 8. UI-Mockup (Beschreibung)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Topbar: Breadcrumb | Search | Export-Button                 │
├────────┬───────────────────────────────────────┬────────────┤
│        │                                       │            │
│ Filter │        Graph Canvas                   │  Details   │
│ Panel  │    (React Flow)                       │  Panel     │
│ (Left) │                                       │  (Right)   │
│        │    ┌───┐    ┌───┐    ┌───┐          │            │
│ [ ] Hub│    │Hub│───▶│UK1│───▶│Blog│         │            │
│ [x] UK │    └───┘    └───┘    └───┘          │            │
│ [ ] Blog    │         │                       │            │
│ [ ] Ratg.   │         ▼                       │  Node:     │
│             │       ┌───┐                     │  UK Händed.│
│ Status:     │       │UK2│                     │            │
│ [x] Pub.    │       └───┘                     │  Type: UK  │
│ [ ] Draft   │         │                       │  Status: ✅│
│ [ ] Plan    │         ▼                       │            │
│             │       ┌───┐                     │  Links:    │
│             │       │Ratg│ (gestrichelt)      │  In: 2     │
│             │       └───┘                     │  Out: 3    │
└────────────┴───────────────────────────────────┴────────────┘
```

### Node-Styles
- **Hub**: Großer blauer Kreis (60px), Label unten
- **Spoke**: Mittelgroßer grüner Kreis (50px)
- **Blog**: Mittelgroßer gelber Kreis (50px)
- **Ratgeber**: Kleiner lila Kreis (40px)
- **Geplant**: Gestrichelte Outline, Grau gefüllt

### Edge-Styles
- **Standard**: Grauer Pfeil (2px), gebogen
- **Hover**: Accent-Blau (3px), Tooltip erscheint
- **Mehrere Links**: Dicker Pfeil (4px) oder Zahl im Label (2x)

---

## 9. Implementierungs-Schritte (für Cursor)

### STEP 16: Datenmodell für Link Graph
**Ziel**: Tabellen `pages` + `page_links` anlegen

**Tasks**:
1. Migration erstellen (`002_link_graph.sql`)
2. Tabellen: `pages`, `page_links`
3. RLS Policies
4. TypeScript Types generieren

**Dauer**: ~1h

---

### STEP 17: Graph-Visualisierung (Leer-State)
**Ziel**: Leere Graph-View mit React Flow

**Tasks**:
1. Route `/projects/:projectId/link-graph` erstellen
2. React Flow einbinden
3. Empty State: "Keine Seiten vorhanden"
4. Topbar mit Breadcrumb + Export-Button
5. Linke Filter-Sidebar (noch nicht funktional)

**Dauer**: ~2h

---

### STEP 18: Nodes & Edges rendern
**Ziel**: Seiten aus DB als Nodes anzeigen

**Tasks**:
1. `usePages.ts` Hook (lädt pages aus DB)
2. `usePageLinks.ts` Hook (lädt page_links aus DB)
3. React Flow Nodes aus `pages` generieren
4. React Flow Edges aus `page_links` generieren
5. Custom Node-Komponenten (Hub, Spoke, Blog, Ratgeber)
6. Dagre-Layout (automatische Positionierung)

**Dauer**: ~4h

---

### STEP 19: Node-Details-Panel
**Ziel**: Klick auf Node → rechtes Panel mit Details

**Tasks**:
1. `NodeDetailsPanel.tsx` erstellen
2. Bei Node-Klick: Panel öffnen + Node-ID speichern
3. Panel zeigt:
   - Name, Typ, Status, Wortcount
   - Incoming Links (mit Anchor-Texten)
   - Outgoing Links
   - Aktionen (Markdown öffnen, Bearbeiten, Löschen)
4. Schließen-Button

**Dauer**: ~3h

---

### STEP 20: Edge-Details (Tooltip)
**Ziel**: Klick auf Edge → Popup mit Link-Details

**Tasks**:
1. Edge-onClick-Handler
2. Tooltip/Modal mit:
   - Von → Nach
   - Anchor-Text
   - Kontextsatz
   - Platzierung
   - Zeile im File
   - Button "Im Editor öffnen"
3. "Bearbeiten"-Button (öffnet Edit-Modal)

**Dauer**: ~2h

---

### STEP 21: Filter & Suche
**Ziel**: Filter-Sidebar funktional machen

**Tasks**:
1. Filter-State (Zustand)
2. Multi-Select für Typ (Hub, Spoke, Blog, Ratgeber)
3. Multi-Select für Status
4. Toggle für "Verwaiste Seiten" (ohne Incoming Links)
5. Suche in Topbar (hebt Node hervor)
6. Nodes/Edges filtern basierend auf Auswahl

**Dauer**: ~3h

---

### STEP 22: Markdown-Upload & Parsing
**Ziel**: Drag & Drop von .md-Files → Auto-Parsing

**Tasks**:
1. Drag & Drop Zone über Graph
2. File-Upload zu Supabase Storage
3. Markdown-Parser (`remark`):
   - Extrahiert Title (`# Heading`)
   - Findet alle Links `[text](url)`
   - Speichert Zeilen-Nummer
4. Auto-Matching von URLs zu Nodes
5. Erstellt neue Nodes + Edges
6. Graph re-rendert

**Dauer**: ~5h

---

### STEP 23: Seite/Link manuell anlegen
**Ziel**: "+ Seite hinzufügen" + "+ Link hinzufügen"-Modals

**Tasks**:
1. `AddPageModal.tsx` (Name, Typ, URL-Slug)
2. `AddLinkModal.tsx` (Von, Nach, Anchor, Kontext, Platzierung)
3. Bei Submit: DB-Insert
4. Graph re-rendert

**Dauer**: ~3h

---

### STEP 24: Export-Funktionen
**Ziel**: PNG-Export + JSON-Export

**Tasks**:
1. PNG-Export (React Flow: `getViewport()` + Canvas)
2. JSON-Export (alle Nodes + Edges als JSON)
3. Markdown-Report (Tabelle wie B2-Artefakt)
4. Download-Buttons in Topbar

**Dauer**: ~2h

---

### STEP 25: Polish (Graph)
**Ziel**: UX-Verbesserungen

**Tasks**:
1. Zoom-Controls (+ / -)
2. "Fit to Screen"-Button
3. Loading-States beim Parsing
4. Error-Handling (unbekannte URLs)
5. Animations (Fade-In bei neuen Nodes)
6. Tooltips bei Hover

**Dauer**: ~2h

---

**Gesamt STEP 16–25**: ~27h

---

## 10. Risiken & Offene Fragen

### Risiken
| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| **Markdown-Parsing zu komplex** (verschiedene Formate) | Mittel | Hoch | Start mit Standard-Markdown (CommonMark), erweitern nach Bedarf |
| **Graph wird bei >100 Nodes unübersichtlich** | Hoch | Mittel | Filter + Clustering (z.B. "Alle Spokes zu Hub X ausblenden") |
| **URL-Matching fehlschlägt** (verschiedene URL-Patterns) | Mittel | Mittel | Fuzzy-Matching + Manuelles Korrigieren-UI |
| **Performance-Probleme** bei vielen Edges (>500 Links) | Niedrig | Mittel | Virtualisierung (React Flow unterstützt das out-of-the-box) |

### Offene Fragen
1. **Soll der Graph Versionierung unterstützen?** (z.B. "Link Graph Stand 01.02.2026")
   - → Entscheidung: Nein im MVP, Post-MVP über Snapshots
2. **Sollen mehrere Markdown-Files gleichzeitig hochgeladen werden?**
   - → Entscheidung: Ja, Bulk-Upload via Zip-File (Post-MVP)
3. **Soll es einen "Auto-Sync"-Modus geben?** (Graph auto-updated bei .md-Änderungen)
   - → Entscheidung: Nein im MVP, Post-MVP über File-Watcher

---

## 11. Erfolgskriterien

### MVP-Erfolgskriterien
- [ ] User kann min. 10 Seiten (Nodes) anlegen
- [ ] User kann min. 20 Links (Edges) anlegen
- [ ] Markdown-Upload funktioniert für Standard-Markdown
- [ ] Graph rendert < 2 Sekunden bei 50 Nodes
- [ ] Filter + Suche funktionieren
- [ ] Export (PNG + JSON) funktioniert

### Post-MVP-Metriken
- **Engagement**: 80% der User nutzen Link Graph min. 1x/Woche
- **Effizienz**: 50% weniger Zeit für "Welche Seite linkt wohin?"-Recherche
- **Content-Qualität**: 30% mehr Cross-Links zwischen UKs (messbar via Avg. Outgoing Links pro Node)

---

## 12. Nicht-Ziele (Out of Scope)

- **Kein Live-Editing im Graph** (Links im Graph ändern → Markdown-File updated)
  - Warum: Zu komplex, One-Way-Sync (Markdown → Graph) ist sicherer
- **Keine KI-gestützte Content-Generierung** ("Schreibe Ratgeber VAH vs. RKI")
  - Warum: Anderes Feature, nicht Teil von Link Graph
- **Keine SEO-Metriken im Graph** (PageRank, Authority Score)
  - Warum: Post-MVP (Nice-to-have N1)
- **Keine Multi-Sprachen-Unterstützung** (gleiche Seite in DE/EN)
  - Warum: Komplexität zu hoch für MVP

---

## 13. Timeline & Milestones

| Milestone | Deadline | Deliverable |
|-----------|----------|-------------|
| **M1: Datenmodell** | Woche 1 | Tabellen pages + page_links in DB |
| **M2: Empty State** | Woche 1 | Leere Graph-View mit React Flow |
| **M3: Basic Rendering** | Woche 2 | Nodes + Edges aus DB rendern |
| **M4: Interaktivität** | Woche 2–3 | Node/Edge-Details, Filter |
| **M5: Markdown-Upload** | Woche 3–4 | Drag & Drop + Parsing |
| **M6: Export** | Woche 4 | PNG/JSON-Export |
| **M7: MVP-Launch** | Woche 5 | Polishing + Testing |

**Gesamt**: ~5 Wochen (~27h Entwicklung + Testing/Bugfixes)

---

## 14. Next Steps

1. **Review** dieses Konzepts mit Team/Stakeholder
2. **Entscheidung**: MVP-Scope bestätigen
3. **STEP 16** starten (Datenmodell)
4. Nach STEP 18: **Erstes Demo** (statischer Graph mit 5 Nodes)
5. Nach STEP 22: **Beta-Test** mit 1 echtem Projekt (Desinfektionsmittel)
6. Nach STEP 25: **MVP-Launch**

---

**Ende des Konzepts**
