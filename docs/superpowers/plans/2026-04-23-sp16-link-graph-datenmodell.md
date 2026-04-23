# SP16: Datenmodell Link Graph - Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tabellen `pages` und `page_links` in Supabase anlegen inklusive RLS Policies, Indexes und TypeScript-Typen, damit SP17+ auf einem spec-konsistenten Datenmodell aufbauen koennen.

**Architecture:** Zwei neue Tabellen unter `projects`, wobei `pages` optional ueber `category_id` an die bestehende Kategorie-/Phasenstruktur angebunden ist. RLS-Pattern identisch zu `categories`: Zugriff via `EXISTS (SELECT 1 FROM projects WHERE id = <table>.project_id AND user_id = auth.uid())`. TypeScript-Typen werden als streng typisierte Interfaces in `src/types/database.types.ts` ergaenzt; bestehende Loose-Types bleiben unveraendert.

**Tech Stack:** PostgreSQL (Supabase), SQL-Migration-File, TypeScript

---

## File Map

| Aktion | Pfad | Zweck |
|--------|------|-------|
| Erstellen | `supabase/migrations/006_link_graph.sql` | DDL: Tabellen, Indexes, RLS Policies |
| Modifizieren | `src/types/database.types.ts` | Typisierte Interfaces fuer `pages` + `page_links` |
| Modifizieren | `docs/ROADMAP_LinkGraph.md` | SP16-Status und Log aktualisieren |

---

## Task 1: Migration schreiben

**Files:**
- Create: `supabase/migrations/006_link_graph.sql`

- [ ] **Step 1: Migration-Datei anlegen**

Erstelle `supabase/migrations/006_link_graph.sql` mit folgendem Inhalt:

```sql
-- SP16: Link Graph - Tabellen pages + page_links

-- =====================
-- 1. pages
-- =====================
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

  -- Persistierte Graph-Position
  position_x         FLOAT,
  position_y         FLOAT,

  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pages_project_id ON pages(project_id);
CREATE INDEX idx_pages_category_id ON pages(category_id);
CREATE INDEX idx_pages_type ON pages(type);
CREATE INDEX idx_pages_status ON pages(status);

-- =====================
-- 2. page_links
-- =====================
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

  -- Link-Instanzen bleiben getrennt; gleiche Quelle/Ziel/Anchor sind erlaubt,
  -- solange sie an anderer Stelle im Dokument vorkommen.
  UNIQUE(from_page_id, to_page_id, anchor_text, line_number_start, line_number_end)
);

CREATE INDEX idx_page_links_project_id ON page_links(project_id);
CREATE INDEX idx_page_links_from ON page_links(from_page_id);
CREATE INDEX idx_page_links_to ON page_links(to_page_id);

-- =====================
-- 3. RLS - pages
-- =====================
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pages of own projects"
  ON pages FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = pages.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create pages in own projects"
  ON pages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = pages.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update pages in own projects"
  ON pages FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = pages.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete pages in own projects"
  ON pages FOR DELETE
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = pages.project_id
      AND p.user_id = auth.uid()
  ));

-- =====================
-- 4. RLS - page_links
-- =====================
ALTER TABLE page_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view page_links of own projects"
  ON page_links FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = page_links.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create page_links in own projects"
  ON page_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = page_links.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update page_links in own projects"
  ON page_links FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = page_links.project_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete page_links in own projects"
  ON page_links FOR DELETE
  USING (EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = page_links.project_id
      AND p.user_id = auth.uid()
  ));
```

---

## Task 2: Migration anwenden und verifizieren

- [ ] **Step 2: Migration ausfuehren**

Fuehre die Migration ueber den ueblichen Projektweg aus.

Option A: Supabase Dashboard -> SQL Editor -> New Query  
Option B: Supabase CLI, falls lokal konfiguriert

```bash
npx supabase db push
```

- [ ] **Step 3: Tabellen und Spalten pruefen**

Pruefe im Supabase Dashboard oder per SQL:

- `pages` existiert mit `category_id`, `project_id`, `name`, `type`, `status`, `url_slug`, `markdown_file_path`, `word_count`, `position_x`, `position_y`, `created_at`, `updated_at`
- `page_links` existiert mit `project_id`, `from_page_id`, `to_page_id`, `anchor_text`, `context_sentence`, `placement`, `line_number_start`, `line_number_end`, `created_at`, `updated_at`

RLS-Check:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('pages', 'page_links');
```

Erwartetes Ergebnis: `rowsecurity = true` fuer beide Tabellen.

- [ ] **Step 4: Constraints gezielt pruefen**

Nutze eine reale `project_id` aus einem eigenen Projekt, damit der Test nicht vorher am Foreign Key oder an RLS scheitert.

CHECK-Constraint fuer `type`:

```sql
INSERT INTO pages (project_id, name, type, status)
VALUES ('<existing-project-id>', 'Test', 'invalid_type', 'published');
```

Erwartetes Ergebnis: Fehler wegen `pages_type_check`.

Unique-Constraint fuer Link-Instanzen:

```sql
-- Vorbereitung: zwei gueltige pages in demselben Projekt anlegen oder bestehende IDs nutzen
INSERT INTO page_links (
  project_id,
  from_page_id,
  to_page_id,
  anchor_text,
  line_number_start,
  line_number_end
)
VALUES
  ('<existing-project-id>', '<from-page-id>', '<to-page-id>', 'Mehr erfahren', 10, 10),
  ('<existing-project-id>', '<from-page-id>', '<to-page-id>', 'Mehr erfahren', 20, 20);
```

Erwartetes Ergebnis: beide Inserts sind erlaubt, weil es unterschiedliche Link-Positionen sind.

```sql
INSERT INTO page_links (
  project_id,
  from_page_id,
  to_page_id,
  anchor_text,
  line_number_start,
  line_number_end
)
VALUES ('<existing-project-id>', '<from-page-id>', '<to-page-id>', 'Mehr erfahren', 10, 10);
```

Erwartetes Ergebnis: Fehler wegen Unique-Constraint.

---

## Task 3: TypeScript-Typen ergaenzen

**Files:**
- Modify: `src/types/database.types.ts`

- [ ] **Step 5: Typen fuer `pages` und `page_links` ergaenzen**

Oeffne `src/types/database.types.ts`. Die Datei hat aktuell `@ts-nocheck` und nur `Record<string, any>`-Loose-Types. Fuege am Ende der Datei die neuen Interfaces hinzu. Bestehende Loose-Types bleiben unveraendert.

```typescript
// Link Graph

export type PageType = 'hub' | 'spoke' | 'blog'
export type PageStatus = 'published' | 'draft' | 'planned'

export interface PageRow {
  id: string
  project_id: string
  category_id: string | null
  name: string
  type: PageType
  status: PageStatus
  url_slug: string | null
  markdown_file_path: string | null
  word_count: number
  position_x: number | null
  position_y: number | null
  created_at: string
  updated_at: string
}

export interface PageInsert {
  project_id: string
  category_id?: string | null
  name: string
  type: PageType
  status?: PageStatus
  url_slug?: string | null
  markdown_file_path?: string | null
  word_count?: number
  position_x?: number | null
  position_y?: number | null
}

export interface PageUpdate {
  category_id?: string | null
  name?: string
  type?: PageType
  status?: PageStatus
  url_slug?: string | null
  markdown_file_path?: string | null
  word_count?: number
  position_x?: number | null
  position_y?: number | null
}

export interface PageLinkRow {
  id: string
  project_id: string
  from_page_id: string
  to_page_id: string
  anchor_text: string | null
  context_sentence: string | null
  placement: string | null
  line_number_start: number | null
  line_number_end: number | null
  created_at: string
  updated_at: string
}

export interface PageLinkInsert {
  project_id: string
  from_page_id: string
  to_page_id: string
  anchor_text?: string | null
  context_sentence?: string | null
  placement?: string | null
  line_number_start?: number | null
  line_number_end?: number | null
}

export interface PageLinkUpdate {
  anchor_text?: string | null
  context_sentence?: string | null
  placement?: string | null
  line_number_start?: number | null
  line_number_end?: number | null
}
```

- [ ] **Step 6: Build und Strukturcheck**

```bash
npm run build
```

Erwartetes Ergebnis: Build bleibt gruen.

Fuehre danach einen kurzen Strukturcheck durch:

- `PageRow` enthaelt `category_id`
- `PageInsert` und `PageUpdate` erlauben `category_id?: string | null`
- `PageLink*` spiegeln das Link-Instanz-Modell mit Zeilenfeldern wider

Hinweis: Wegen `@ts-nocheck` ist der Build nur ein Syntax-/Integrationscheck, nicht der Beweis fuer semantische Typabdeckung.

---

## Task 4: Roadmap-Log aktualisieren und committen

**Files:**
- Modify: `docs/ROADMAP_LinkGraph.md`

- [ ] **Step 7: Roadmap-Log fuer SP16 eintragen**

Oeffne `docs/ROADMAP_LinkGraph.md`. Aktualisiere den SP16-Abschnitt:

```markdown
## SP16 - Datenmodell fuer Link Graph

**Geschaetzte Dauer:** ~1h  
**Status:** [x] Abgeschlossen

...

**Log:**
- YYYY-MM-DD HH:MM - gestartet
- YYYY-MM-DD HH:MM - abgeschlossen
```

Ersetze `YYYY-MM-DD HH:MM` durch das tatsaechliche Datum und die Uhrzeit.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/006_link_graph.sql src/types/database.types.ts docs/ROADMAP_LinkGraph.md
git commit -m "feat(sp16): Link Graph Datenmodell - pages + page_links mit RLS und TypeScript-Typen"
```

---

## Self-Review Checklist

- [x] **Spec-Abdeckung:** Migration enthaelt `pages` und `page_links`, `pages.category_id`, alle benoetigten Felder, Indexes und RLS Policies gemaess aktueller Spec.
- [x] **Link-Instanz-Modell:** Das Unique-Constraint erlaubt mehrere gleichlautende Anchors zwischen denselben Seiten, solange sich die Dokumentposition unterscheidet.
- [x] **Typ-Konsistenz:** `PageType`, `PageStatus` als Union-Types definiert; `PageRow`, `PageInsert`, `PageUpdate` enthalten `category_id` konsistent.
- [x] **Verifikation belastbar:** Constraint-Checks nutzen reale IDs statt absichtlich ungueltiger Foreign Keys.
- [x] **Keine veralteten Felder:** `link_purpose` bleibt bewusst ausserhalb des MVP.
