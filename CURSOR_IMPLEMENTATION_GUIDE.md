# SEO Workflow Platform – Cursor Implementation Guide

## Projektübersicht

Eine webbasierte Workflow-Management-Plattform für SEO-optimierten Content. Nutzer können Projekte mit Kategorien (Shop-Content) und Blog-Artikeln (Content-Marketing) anlegen, Artefakte (Prompts) Schritt-für-Schritt abarbeiten, Ergebnisse speichern und Templates für Wiederverwendung erstellen.

---

## Tech Stack

### Frontend
- **React 18** mit TypeScript
- **Vite** (Build-Tool)
- **TanStack Router** (File-based Routing)
- **TanStack Query** (Data Fetching & Caching)
- **Zustand** (State Management)
- **Tailwind CSS** (Styling – helles Theme wie in HTML-Prototypen)
- **Headless UI** (Accessible Components)
- **React Hook Form** + Zod (Forms & Validation)

### Backend
- **Node.js 20+** mit TypeScript
- **Express.js** (REST API)
- **Supabase Client** (Database Interface)
- **Zod** (Runtime Validation)

### Database
- **Supabase** (PostgreSQL)
- **Row Level Security** (RLS) aktiviert
- **Realtime** für Live-Updates (optional)

### Development
- **pnpm** (Package Manager)
- **ESLint** + **Prettier**
- **Vitest** (Testing)

---

## Design-System (WICHTIG!)

### Farben (Helles Theme – wie HTML-Prototypen)
```css
--bg: #fafbfc;           /* Hintergrund */
--surface: #ffffff;       /* Cards/Panels */
--surface2: #f4f6f8;      /* Hover/Inactive */
--border: #e1e4e8;        /* Rahmen */
--accent: #5b7fff;        /* Primär-Blau */
--accent-light: #e8edff;  /* Accent Hintergrund */
--green: #10b981;         /* Erfolg */
--yellow: #f59e0b;        /* In Arbeit */
--red: #ef4444;           /* Fehler */
--text: #1a202c;          /* Haupttext */
--text-secondary: #4a5568; /* Sekundärtext */
--muted: #718096;         /* Grauer Text */
```

### Typografie
- **Sans**: Inter (System-Font Fallback)
- **Mono**: JetBrains Mono (für Code/Prompts)
- **Größen**: 11px–20px (siehe HTML-Prototypen)

### Phase-Badges (Farbcodierung)
- **A** = Lila (#7c3aed)
- **B** = Blau (#2563eb)
- **C** = Gelb (#d97706)
- **D** = Grün (#059669)
- **E** = Rot (#dc2626)
- **F** = Grau (#6b7280)

---

## Datenbank-Schema (Supabase/PostgreSQL)

### 1. `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
```

### 2. `categories`
```sql
CREATE TYPE content_type AS ENUM ('category', 'blog');

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- NULL = Hub, NOT NULL = Spoke
  name VARCHAR(255) NOT NULL,
  type content_type NOT NULL DEFAULT 'category',
  hub_name VARCHAR(255), -- Nur für Hub (parent_id IS NULL)
  
  -- Metadaten
  zielgruppen TEXT[], -- Array: ['Privat', 'Pflege', 'Praxis']
  shop_typ VARCHAR(100), -- Nur für category
  usps TEXT,
  ton TEXT,
  no_gos TEXT,
  
  -- Status
  display_order INT DEFAULT 0, -- Sortierung in Sidebar
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_project_id ON categories(project_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- WICHTIG: Markt & Sprache sind NICHT Teil des Schemas
-- Diese Felder wurden bewusst entfernt
```

### 3. `artifacts`
```sql
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Identifikation
  phase CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')), -- G/X = Custom
  artifact_code VARCHAR(10) NOT NULL, -- z.B. 'A1', 'B2.1'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Prompt
  prompt_template TEXT NOT NULL,
  
  -- Optionen
  recommended_source VARCHAR(50), -- 'perplexity', 'chatgpt', 'claude', 'manual'
  estimated_duration_minutes INT,
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(category_id, artifact_code)
);

CREATE INDEX idx_artifacts_category_id ON artifacts(category_id);
CREATE INDEX idx_artifacts_phase ON artifacts(phase);
```

### 4. `artifact_results`
```sql
CREATE TYPE result_status AS ENUM ('draft', 'final');

CREATE TABLE artifact_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  
  result_text TEXT,
  source VARCHAR(50), -- 'perplexity', 'chatgpt', 'manual'
  version INT DEFAULT 1,
  status result_status DEFAULT 'draft',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artifact_results_artifact_id ON artifact_results(artifact_id);
CREATE INDEX idx_artifact_results_version ON artifact_results(artifact_id, version DESC);
```

### 5. `artifact_dependencies`
```sql
CREATE TABLE artifact_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  depends_on_artifact_id UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  depends_on_phase CHAR(1), -- Alternative: Alle aus Phase A
  placeholder_name VARCHAR(50) NOT NULL, -- z.B. '[INPUT A]'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (
    (depends_on_artifact_id IS NOT NULL AND depends_on_phase IS NULL) OR
    (depends_on_artifact_id IS NULL AND depends_on_phase IS NOT NULL)
  )
);

CREATE INDEX idx_artifact_dependencies_artifact_id ON artifact_dependencies(artifact_id);
```

### 6. `templates` (User-Templates)
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  phase CHAR(1) NOT NULL,
  artifact_code VARCHAR(10),
  
  prompt_template TEXT NOT NULL,
  tags TEXT[], -- ['SEO', 'Analyse', 'Content']
  
  -- Stats
  usage_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_phase ON templates(phase);
```

### 7. RLS Policies (Beispiel für `projects`)
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Analog für andere Tabellen
```

---

## Implementierungs-Schritte (Context-Safe für Cursor)

### **STEP 1: Projekt-Setup & Basisstruktur**

**Ziel**: Leeres React-Projekt mit Routing, Styling und Supabase-Connection

**Tasks**:
1. Vite + React + TypeScript initialisieren
2. Tailwind CSS konfigurieren (mit Design-System-Variablen)
3. TanStack Router einrichten (File-based)
4. Supabase Client initialisieren
5. Layout-Komponente erstellen (Sidebar + Main)
6. Font-Integration (Inter + JetBrains Mono)

**Dateien**:
- `vite.config.ts`
- `tailwind.config.js` (mit Design-Variablen)
- `src/lib/supabase.ts`
- `src/components/Layout.tsx`
- `src/routes/__root.tsx`

**Akzeptanzkriterien**:
- [ ] App startet ohne Fehler
- [ ] Tailwind funktioniert mit hellem Theme
- [ ] Supabase-Connection erfolgreich
- [ ] Layout zeigt Sidebar + Main-Bereich

---

### **STEP 2: Datenbank-Schema & Seed-Daten**

**Ziel**: Supabase-Datenbank aufsetzen mit allen Tabellen

**Tasks**:
1. SQL-Migrations erstellen (alle 7 Tabellen)
2. RLS Policies für alle Tabellen
3. Seed-Daten erstellen:
   - 1 Demo-Projekt "Medizinprodukte-Shop"
   - 3 Oberkategorien (Oberkategorie, Handschuhe, Masken)
   - 4 Unterkategorien für "Oberkategorie"
   - Standard-Artefakte (A1, A1.2, A2.1... F5) für 1 Kategorie
   - 3 Beispiel-Templates
4. TypeScript Types generieren aus Schema

**Dateien**:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed.sql`
- `src/types/database.types.ts` (auto-generiert)

**Akzeptanzkriterien**:
- [ ] Alle Tabellen in Supabase angelegt
- [ ] RLS funktioniert
- [ ] Seed-Daten vorhanden
- [ ] Types in Frontend verfügbar

---

### **STEP 3: Projekt-/Kategorie-Navigation (Sidebar)**

**Ziel**: Linke Sidebar mit Projekt-/Kategorieliste (basierend auf `seo-workflow-with-blog.html`)

**Tasks**:
1. `ProjectSidebar.tsx` erstellen
2. Projekte aus DB laden (TanStack Query)
3. Kategorien pro Projekt laden (expandable)
4. Icons/Badges für Kategorie vs. Blog
5. Progress-Anzeige (4/18)
6. Active-State (URL-basiert)
7. "+ Neues Projekt"-Button (noch ohne Funktion)

**Dateien**:
- `src/components/ProjectSidebar.tsx`
- `src/hooks/useProjects.ts`
- `src/hooks/useCategories.ts`

**Referenz-HTML**: `seo-workflow-with-blog.html` (Sidebar-Bereich)

**Akzeptanzkriterien**:
- [ ] Sidebar zeigt Projekte aus DB
- [ ] Kategorien sind expandable
- [ ] Active-State funktioniert
- [ ] Design matcht HTML-Prototyp

---

### **STEP 4: Workflow-Tabelle (Hauptscreen)**

**Ziel**: Hauptansicht mit Artefakt-Tabelle (basierend auf `seo-workflow-light.html`)

**Tasks**:
1. Route `/projects/:projectId/categories/:categoryId` erstellen
2. `WorkflowTable.tsx` erstellen
3. Artefakte aus DB laden
4. Phase-Pills oben (mit Fortschrittsanzeige)
5. Tabelle mit Spalten: Phase | Artefakt | Status | Aktionen
6. Status-Dots (✅ ⏳ ⬜)
7. Action-Buttons (Prompt kopieren, Ergebnis kopieren, Details)

**Dateien**:
- `src/routes/projects/$projectId/categories/$categoryId/index.tsx`
- `src/components/WorkflowTable.tsx`
- `src/components/PhasePills.tsx`
- `src/hooks/useArtifacts.ts`

**Referenz-HTML**: `seo-workflow-light.html` (Content-Bereich)

**Akzeptanzkriterien**:
- [ ] Tabelle zeigt Artefakte aus DB
- [ ] Phase-Pills zeigen Fortschritt
- [ ] Buttons sind klickbar
- [ ] Design matcht Prototyp

---

### **STEP 5: Artefakt-Detail-Panel (rechts)**

**Ziel**: Rechtes Panel mit Prompt/Ergebnis-Anzeige

**Tasks**:
1. `ArtifactPanel.tsx` erstellen (Slide-In von rechts)
2. Prompt mit ersetzten Platzhaltern anzeigen
3. Ergebnis-Anzeige (mit Source/Version)
4. Copy-to-Clipboard für Prompt/Ergebnis
5. Notiz-Feld (editierbar)
6. "Abschließen"-Button (Status → done)

**Dateien**:
- `src/components/ArtifactPanel.tsx`
- `src/hooks/useArtifactResults.ts`
- `src/utils/replacePlaceholders.ts`

**Referenz-HTML**: `seo-workflow-light.html` (Panel-Bereich)

**Akzeptanzkriterien**:
- [ ] Panel öffnet bei Klick auf Artefakt
- [ ] Platzhalter werden ersetzt
- [ ] Copy funktioniert
- [ ] Ergebnis kann gespeichert werden

---

### **STEP 6: Kategorie/Blog anlegen**

**Ziel**: Modal zum Erstellen neuer Kategorien/Blogs (basierend auf `kategorie-anlegen.html`)

**Tasks**:
1. `CreateCategoryModal.tsx` erstellen
2. Type-Selector (Kategorie vs. Blog)
3. Formular (dynamisch je nach Type):
   - Name (Pflichtfeld)
   - Hub-Name (optional, nur bei Kategorie)
   - Unterkategorien als Tags (nur bei Kategorie)
   - Thema/Fokus-Keyword (nur bei Blog)
   - Zielgruppen als Tags (Pflichtfeld)
   - Shop-Typ Dropdown (nur bei Kategorie)
   - USPs (optional)
   - Tonalität (optional, mit Preset)
   - No-Gos (optional, mit Preset)
   - **WICHTIG: KEINE Markt & Sprache-Felder!**
4. Bei Submit:
   - Kategorie in DB anlegen
   - Standard-Artefakte automatisch erstellen (18 für Kategorie, 12 für Blog)
5. Redirect zu neuem Workflow

**Dateien**:
- `src/components/CreateCategoryModal.tsx`
- `src/hooks/useCreateCategory.ts`
- `src/utils/createDefaultArtifacts.ts`

**Referenz-HTML**: `kategorie-anlegen.html` (OHNE Markt & Sprache Section)

**Akzeptanzkriterien**:
- [ ] Modal öffnet bei "+ Neue Kategorie"
- [ ] Type-Switch funktioniert
- [ ] Formular zeigt nur relevante Felder (je nach Type)
- [ ] KEINE Markt & Sprache-Felder vorhanden
- [ ] Kategorie wird angelegt
- [ ] 18 Artefakte automatisch erstellt (Kategorie) oder 12 (Blog)
- [ ] Redirect zum Workflow

---

### **STEP 7: Metadaten bearbeiten**

**Ziel**: Kategorie-Einstellungen (basierend auf `kategorie-bearbeiten.html`)

**Tasks**:
1. Route `/projects/:projectId/categories/:categoryId/settings` erstellen
2. 3 Tabs: Metadaten, Unterkategorien, Erweitert
3. Tab 1 (Metadaten):
   - Name/Hub-Name editieren
   - Zielgruppen/Ton/No-Gos editieren
   - USPs editieren (falls Kategorie)
   - Shop-Typ editieren (falls Kategorie)
   - **WICHTIG: KEINE Markt & Sprache-Felder!**
4. Tab 2 (Unterkategorien):
   - Liste mit Fortschritt
   - "+ Neue Unterkategorie"-Modal
   - Delete mit Confirmation
5. Save-Bar unten (bei Änderungen)

**Dateien**:
- `src/routes/projects/$projectId/categories/$categoryId/settings.tsx`
- `src/components/CategorySettingsTabs.tsx`
- `src/components/SubcategoryList.tsx`
- `src/components/SaveBar.tsx`

**Referenz-HTML**: `kategorie-bearbeiten.html` (OHNE Markt & Sprache Section)

**Akzeptanzkriterien**:
- [ ] Tabs funktionieren
- [ ] Metadaten editierbar (Name, Zielgruppen, Ton, No-Gos, USPs, Shop-Typ)
- [ ] KEINE Markt & Sprache-Felder vorhanden
- [ ] Unterkategorien anlegbar/löschbar
- [ ] Save-Bar erscheint bei Änderungen

---

### **STEP 8: Dashboard/Übersicht**

**Ziel**: Übersichts-Screen (basierend auf `uebersicht-screen.html`)

**Tasks**:
1. Route `/projects/:projectId/categories/:categoryId/overview` erstellen
2. Hero-Bereich (große %-Anzeige)
3. 4 Mini-Stats (Artefakte fertig/in Arbeit/offen, Zeit)
4. 4 Dashboard-Cards:
   - Fortschritt pro Phase (mit Balken)
   - Timeline (letzte Aktivitäten)
   - Hinweise & nächste Schritte
   - Schnellstatistik
5. Berechnungen (% Fortschritt, verbleibende Zeit)

**Dateien**:
- `src/routes/projects/$projectId/categories/$categoryId/overview.tsx`
- `src/components/DashboardCards.tsx`
- `src/hooks/useStats.ts`

**Referenz-HTML**: `uebersicht-screen.html`

**Akzeptanzkriterien**:
- [ ] Dashboard zeigt korrekte Statistiken
- [ ] Timeline zeigt letzte Aktivitäten
- [ ] Cards sind visuell korrekt

---

### **STEP 9: Artefakt anlegen (Custom)**

**Ziel**: 3-Schritt-Wizard zum Erstellen eigener Artefakte (basierend auf `artefakt-anlegen.html`)

**Tasks**:
1. `CreateArtifactWizard.tsx` erstellen
2. Step 1: Name, Code, Phase-Selector
3. Step 2: Prompt-Editor mit Platzhalter-Chips
4. Step 3: Dependencies, Source, Dauer
5. Step-Indicator oben
6. Live Prompt-Vorschau
7. Bei Submit: Artefakt in DB anlegen

**Dateien**:
- `src/components/CreateArtifactWizard.tsx`
- `src/components/PhaseSelector.tsx`
- `src/components/PromptEditor.tsx`

**Referenz-HTML**: `artefakt-anlegen.html`

**Akzeptanzkriterien**:
- [ ] Wizard mit 3 Steps
- [ ] Platzhalter einfügbar
- [ ] Preview funktioniert
- [ ] Artefakt wird angelegt

---

### **STEP 10: Template-Bibliothek**

**Ziel**: Katalog mit vorgefertigten Templates (basierend auf `template-bibliothek.html`)

**Tasks**:
1. `TemplateBrowser.tsx` erstellen
2. Grid/List-View (Toggle)
3. Linke Sidebar mit Filtern
4. Template-Karten (mit Preview)
5. Suchfeld
6. "Template anlegen"-Button → lädt ins Artefakt-Formular
7. 10 Standard-Templates in DB seeden

**Dateien**:
- `src/components/TemplateBrowser.tsx`
- `src/components/TemplateCard.tsx`
- `src/hooks/useTemplates.ts`
- `supabase/seed_templates.sql`

**Referenz-HTML**: `template-bibliothek.html`

**Akzeptanzkriterien**:
- [ ] Grid/List-View funktioniert
- [ ] Filter funktionieren
- [ ] Suche funktioniert
- [ ] Template kann verwendet werden

---

### **STEP 11: Template speichern**

**Ziel**: Eigene Templates erstellen (basierend auf `template-speichern-v2.html`)

**Tasks**:
1. `SaveTemplateModal.tsx` erstellen
2. Artefakt-Vorschau
3. Name/Beschreibung editierbar
4. Tags (mit Chips)
5. Checkbox "Prompt einschließen"
6. Success-Animation
7. Bei Submit: Template in DB speichern

**Dateien**:
- `src/components/SaveTemplateModal.tsx`
- `src/hooks/useSaveTemplate.ts`

**Referenz-HTML**: `template-speichern-v2.html`

**Akzeptanzkriterien**:
- [ ] Modal öffnet bei "Als Template speichern"
- [ ] Template wird gespeichert
- [ ] Success-Animation zeigt
- [ ] Template erscheint in Bibliothek

---

### **STEP 12: Platzhalter-System**

**Ziel**: Automatisches Ersetzen von Platzhaltern in Prompts

**Tasks**:
1. `replacePlaceholders.ts` erstellen
2. Globale Platzhalter aus Kategorie-Metadaten:
   - `[KATEGORIE]` → category.name
   - `[ZIELGRUPPEN]` → category.zielgruppen.join(', ')
   - `[USPs]` → category.usps
   - `[TON]` → category.ton
   - `[NO-GOS]` → category.no_gos
   - `[SHOP-TYP]` → category.shop_typ (nur bei Kategorie)
   - **WICHTIG: [LAND] und [SPRACHE] sind NICHT verfügbar**
3. Dynamische Platzhalter aus Dependencies:
   - `[INPUT A]` → alle Ergebnisse aus Phase A
   - `[BRIEFING]` → Ergebnis von C1
   - `[TEXT]` → Ergebnis von D1
   - etc.
4. Rekursives Ersetzen (verschachtelte Platzhalter)
5. Fallback für undefined Platzhalter (z.B. `[KATEGORIE]` statt Fehler)

**Dateien**:
- `src/utils/replacePlaceholders.ts`
- `src/hooks/usePlaceholderData.ts`

**Akzeptanzkriterien**:
- [ ] Platzhalter werden korrekt ersetzt
- [ ] Dependencies funktionieren
- [ ] Edge Cases behandelt (undefined, null)
- [ ] KEINE [LAND] oder [SPRACHE] Platzhalter

---

### **STEP 13: Copy-to-Clipboard & Export**

**Ziel**: Prompts/Ergebnisse kopieren + Export-Funktion

**Tasks**:
1. `useCopyToClipboard.ts` Hook erstellen
2. Toast-Notification bei erfolgreichen Copy
3. "Copy Multiple Results" (mehrere Ergebnisse kombiniert)
4. Export-Funktion:
   - Alle Artefakte + Ergebnisse als Markdown
   - Optional: Word-Export (docx.js)
5. Export-Modal mit Optionen

**Dateien**:
- `src/hooks/useCopyToClipboard.ts`
- `src/utils/exportCategory.ts`
- `src/components/ExportModal.tsx`

**Akzeptanzkriterien**:
- [ ] Copy funktioniert
- [ ] Toast zeigt "Kopiert!"
- [ ] Export als Markdown funktioniert
- [ ] Word-Export optional

---

### **STEP 14: Authentifizierung**

**Ziel**: User-Login/Signup mit Supabase Auth

**Tasks**:
1. Login/Signup-Screen erstellen
2. Supabase Auth konfigurieren
3. Protected Routes (Redirect wenn nicht eingeloggt)
4. User-Menü in Topbar
5. Logout-Funktion

**Dateien**:
- `src/routes/login.tsx`
- `src/routes/signup.tsx`
- `src/components/AuthProvider.tsx`
- `src/components/UserMenu.tsx`

**Akzeptanzkriterien**:
- [ ] Login funktioniert
- [ ] Signup funktioniert
- [ ] Protected Routes funktionieren
- [ ] Logout funktioniert

---

### **STEP 15: Polish & Final Touches**

**Ziel**: UX-Verbesserungen, Loading-States, Error-Handling

**Tasks**:
1. Loading-Skeletons für alle Listen/Tabellen
2. Error-States (404, 500, Empty States)
3. Optimistic Updates (TanStack Query)
4. Keyboard-Shortcuts (z.B. Cmd+K für Suche)
5. Responsive Design (Mobile anpassen)
6. Performance-Optimierung (Code-Splitting)
7. Animations/Transitions (Framer Motion)

**Dateien**:
- `src/components/LoadingSkeleton.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/EmptyState.tsx`

**Akzeptanzkriterien**:
- [ ] Loading-States überall
- [ ] Error-Handling robust
- [ ] App fühlt sich flüssig an
- [ ] Mobile funktioniert

---

## Projekt-Struktur (Final)

```
seo-workflow-platform/
├── src/
│   ├── routes/                    # TanStack Router (File-based)
│   │   ├── __root.tsx
│   │   ├── index.tsx              # Dashboard
│   │   ├── login.tsx
│   │   ├── projects/
│   │   │   ├── $projectId/
│   │   │   │   ├── categories/
│   │   │   │   │   ├── $categoryId/
│   │   │   │   │   │   ├── index.tsx        # Workflow-Tabelle
│   │   │   │   │   │   ├── overview.tsx     # Dashboard
│   │   │   │   │   │   └── settings.tsx     # Metadaten
│   │   │   │   │   └── index.tsx
│   │   │   │   └── index.tsx
│   │   └── templates.tsx          # Template-Bibliothek
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── ProjectSidebar.tsx
│   │   ├── WorkflowTable.tsx
│   │   ├── ArtifactPanel.tsx
│   │   ├── CreateCategoryModal.tsx
│   │   ├── CreateArtifactWizard.tsx
│   │   ├── TemplateBrowser.tsx
│   │   ├── SaveTemplateModal.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useCategories.ts
│   │   ├── useArtifacts.ts
│   │   ├── useTemplates.ts
│   │   └── ...
│   ├── lib/
│   │   └── supabase.ts
│   ├── utils/
│   │   ├── replacePlaceholders.ts
│   │   ├── createDefaultArtifacts.ts
│   │   └── exportCategory.ts
│   ├── types/
│   │   └── database.types.ts
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## Wichtige Hinweise für Cursor

### Design-System verwenden
- Alle Farben aus Tailwind-Config (siehe Design-System oben)
- Keine Inline-Styles, nur Tailwind-Klassen
- **HELLES THEME** verwenden (wie HTML-Prototypen)
- Inter + JetBrains Mono Fonts

### HTML-Prototypen als Referenz
- Styling 1:1 aus HTML-Prototypen übernehmen
- Spacing, Border-Radius, Shadows matchen
- Animationen/Transitions wie in Prototypen
- **WICHTIG: Markt & Sprache-Sections aus HTML-Prototypen IGNORIEREN und NICHT implementieren**

### Entfernte Features
- **Markt & Sprache**: Diese Felder sind NICHT Teil der Implementierung
- In HTML-Prototypen noch vorhanden, aber in DB-Schema und UI-Komponenten weglassen
- Betrifft: `kategorie-anlegen.html`, `kategorie-bearbeiten.html`, `metadaten-screen.html`

### Supabase Best Practices
- Immer RLS aktivieren
- User-ID in allen Queries filtern
- Optimistic Updates für bessere UX
- Realtime für Live-Updates (optional)

### TypeScript
- Strikte Types aktivieren
- Alle Props typen
- Zod für Runtime-Validation
- Database Types aus Supabase generieren

### Performance
- TanStack Query für Caching
- Code-Splitting pro Route
- Lazy Loading für große Komponenten
- Optimistic Updates

---

## Zusammenfassung der Steps

| Step | Fokus | Dauer (est.) |
|------|-------|--------------|
| 1 | Setup | 1h |
| 2 | Database | 2h |
| 3 | Sidebar | 2h |
| 4 | Workflow-Tabelle | 3h |
| 5 | Detail-Panel | 2h |
| 6 | Kategorie anlegen | 3h |
| 7 | Metadaten bearbeiten | 4h |
| 8 | Dashboard | 3h |
| 9 | Artefakt anlegen | 3h |
| 10 | Template-Bibliothek | 3h |
| 11 | Template speichern | 2h |
| 12 | Platzhalter-System | 2h |
| 13 | Copy/Export | 2h |
| 14 | Auth | 2h |
| 15 | Polish | 4h |
| **Total** | | **~38h** |

---

## Nächste Schritte

1. **STEP 1** starten: Projekt-Setup
2. Nach Completion: Code committen
3. Zu **STEP 2** weitergehen
4. Iterativ Steps abarbeiten
5. Nach jedem Step: Testing + Commit

**Wichtig**: Jeden Step einzeln abschließen, bevor zum nächsten gewechselt wird. Das verhindert Context-Overflow in Cursor.

---

**Ende des Implementation Guides**
