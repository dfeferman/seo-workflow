# Plan: Referenz-Dokumente (.md) in Metadaten

## Ziel

In den **Einstellungen → Metadaten** eine Stelle, an der du **mehrere .md-Dateien** anlegen, bearbeiten und speichern kannst. Diese Dokumente werden beim Promting **referenziert**, sodass du ihren Inhalt **kopieren** und in ChatGPT oder Perplexity einfügen kannst.

- **Anlegen/Editieren/Speichern:** in Metadaten (neuer Abschnitt).
- **Referenz beim Promting:** In der Nähe des Prompts (z. B. Artefakt-Panel oder Workflow) die Dokumente sichtbar machen und pro Dokument einen **„Kopieren“-Button** anbieten → Inhalt in Zwischenablage, zum Einfügen in externen KI-Chat.

---

## 1. Datenmodell

### Neue Tabelle: `category_reference_docs`

| Spalte           | Typ         | Beschreibung |
|------------------|-------------|--------------|
| id               | UUID        | PK, default gen_random_uuid() |
| category_id      | UUID        | FK → categories(id) ON DELETE CASCADE |
| title            | TEXT        | Anzeigename / Dateiname (z. B. "Guidelines.md", "Briefing-Vorlage") |
| content          | TEXT        | Markdown-Inhalt |
| display_order    | INT         | Sortierung, default 0 |
| created_at       | TIMESTAMPTZ | |
| updated_at       | TIMESTAMPTZ | |

- **Eindeutigkeit:** Pro Kategorie nur eindeutige `title` (UNIQUE(category_id, title)) oder beliebige Titel erlauben (einfacher: kein UNIQUE).
- **Index:** `idx_category_reference_docs_category_id ON category_reference_docs(category_id)`.

**Zuordnung:** Pro **Kategorie** (category_id). Hub und Unterkategorien haben jeweils ihre eigenen Dokumente. Optional später: Unterkategorien könnten Dokumente des Hubs mit anzeigen (wie bei Platzhaltern).

### Migration

- Neue Datei: `supabase/migrations/005_category_reference_docs.sql`
- RLS: Tabelle aktivieren, Policy so dass Lese/Schreibzugriff nur für Nutzer gilt, die das zugehörige Projekt (über category → project) besitzen (analog zu categories/artifacts).

---

## 2. Frontend – Metadaten (Einstellungen)

### Ort

- **CategorySettingsTabs**, Tab **„Metadaten“** (activeTab === 'metadaten').
- Neuer Block **„05 · Referenz-Dokumente (.md)“** – unterhalb von „04 · Platzhalter“ (oder als zweite Spalte / darunter, je nach Layout).

### UI-Funktionen

1. **Liste** der Referenz-Dokumente der aktuellen Kategorie:
   - Titel (z. B. "Guidelines.md")
   - Optional: Kurz-Vorschau (erste Zeile oder erste 80 Zeichen)
   - Aktionen: **Bearbeiten**, **Löschen** (mit Bestätigung)

2. **Neues Dokument:**
   - Button „+ Referenz-Dokument hinzufügen“
   - Dialog oder Inline-Editor:
     - **Titel** (Pflichtfeld), z. B. "Guidelines.md" oder "Briefing-Vorlage"
     - **Inhalt:** mehrzeiliges Textfeld (Markdown), ausreichend hoch (z. B. min-height 200px)
   - **Speichern** → Insert in `category_reference_docs` (category_id = aktuelle Kategorie).

3. **Bearbeiten:**
   - Gleiche Felder (Titel, Inhalt) vorausgefüllt, **Speichern** → Update, **Abbrechen** → Schließen ohne Speichern.

4. **Löschen:**
   - Bestätigungsdialog, danach Delete in DB.

### Technik

- **Daten:** React Query (z. B. `useReferenceDocs(categoryId)`) mit Supabase: `from('category_reference_docs').select().eq('category_id', categoryId).order('display_order')`.
- **Mutations:** `useInsertReferenceDoc`, `useUpdateReferenceDoc`, `useDeleteReferenceDoc` (oder eine generische Mutation mit invalidate auf die Liste).
- **Dirty-State:** Wenn im Metadaten-Tab Änderungen an Referenz-Dokumenten vorliegen, SaveBar wie bei den anderen Metadaten-Feldern berücksichtigen (optional: eigene „Speichern“-Aktion pro Dokument, dann kein Dirty für die allgemeine Metadaten-SaveBar).

Empfehlung: **Pro Dokument sofort speichern** (Speichern-Button im Editor/Dialog), dann braucht die SaveBar keine Integration der Referenz-Dokumente.

---

## 3. Referenz beim Promting – Kopieren

### Ort

- **ArtifactPanel** (rechte Sidebar beim Artefakt) oder direkt über der Prompt-Anzeige/-Bearbeitung.
- Sichtbar für die **aktuelle Kategorie** (category_id des Artefakts).

### UI

- Abschnitt **„Referenz-Dokumente“** (oder „.md zum Kopieren“):
  - Für jedes Referenz-Dokument der Kategorie eine Zeile:
    - **Titel** (z. B. "Guidelines.md")
    - Button **„Kopieren“** → `navigator.clipboard.writeText(doc.content)`.
  - Optional: Klick auf Titel öffnet eine kleine Vorschau (Modal oder aufklappbar), dann „Kopieren“ darin.

So kannst du beim Arbeiten am Prompt schnell den gewünschten .md-Text kopieren und in ChatGPT/Perplexity einfügen.

### Daten

- Gleiche Quelle wie in Metadaten: `useReferenceDocs(categoryId)` mit `categoryId = artifact.category_id`. Wenn die Liste bereits in CategorySettingsTabs geladen wird, ist das eine zweite Nutzung derselben Query (Cache).

### Vererbung (optional)

- Wenn gewünscht: Für Unterkategorien zuerst Dokumente des **Hubs** (parent_id) laden, dann eigene Dokumente der Unterkategorie. Anzeige z. B. „Guidelines (Hub)“ vs. „Eigene Vorlage“. Kann in Phase 2.

---

## 4. Optionale Erweiterung: Platzhalter [REF:…]

Falls später gewünscht: Platzhalter wie **`[REF:Guidelines]`** oder **`[REF:Guidelines.md]`** im Prompt-Template, die beim Anzeigen/Ausführen des Prompts durch den **Inhalt** des Referenz-Dokuments mit diesem Titel ersetzt werden. Dann würde der Text direkt im Prompt erscheinen (nicht nur zum Kopieren). Das wäre eine Erweiterung von `replacePlaceholders` bzw. der Platzhalter-Map.

Für den beschriebenen Usecase („kopieren und in ChatGPT/Perplexity einfügen“) reicht **Abschnitt 3 (Kopieren-Button)**.

---

## 5. Implementierungs-Reihenfolge

| Phase | Inhalt |
|-------|--------|
| 1 | Migration `005_category_reference_docs.sql` (Tabelle + RLS), Types in `database.types.ts` ergänzen |
| 2 | Hooks: `useReferenceDocs(categoryId)`, Mutations für Insert/Update/Delete |
| 3 | Metadaten-UI: Abschnitt „05 · Referenz-Dokumente (.md)“ in CategorySettingsTabs – Liste, Anlegen, Bearbeiten, Löschen |
| 4 | ArtifactPanel (oder Prompt-Bereich): Block „Referenz-Dokumente“ mit Kopieren-Button pro Dokument |

---

## 6. Kurzfassung

- **Neue Tabelle:** `category_reference_docs` (category_id, title, content, display_order).
- **Metadaten:** Neuer Abschnitt „05 · Referenz-Dokumente (.md)“ – mehrere .md-Dokumente pro Kategorie anlegen, editieren, speichern.
- **Promting:** Beim Artefakt einen Bereich „Referenz-Dokumente“ mit **Kopieren**-Button pro Dokument → Inhalt in Zwischenablage für ChatGPT/Perplexity.
- **Optional später:** Platzhalter `[REF:Titel]` für automatische Einbettung im Prompt.
