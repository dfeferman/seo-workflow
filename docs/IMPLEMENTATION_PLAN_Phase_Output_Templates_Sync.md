# Implementierungsplan: Phase-A-Output löschen, Template bearbeiten/löschen, Bibliothek→Artefakte-Sync

## Übersicht

Drei Themen: (1) „Phase A · Output“ pro Kategorie/Phase löschen, (2) Prompt-Templates in der Bibliothek und an Artefakten bearbeiten/löschen, (3) Änderungen an Templates in der Bibliothek in verknüpfte Artefakte übernehmen. Die Codebase nutzt **Kopie** des Template-Texts in `artifacts.prompt_template` ohne `template_id`; für Sync ist eine optionale Referenz `artifact.template_id` vorgesehen.

## Anforderungen

- Nutzer kann „Phase X · Output“ (kompilierter Output) pro Kategorie und Phase löschen.
- Bibliothek-Templates (Tabelle `templates`) sind bereits bearbeitbar/löschbar; an Artefakten soll der Prompt (`artifact.prompt_template`) bearbeitbar und zurücksetzbar sein.
- Bei Änderung eines Bibliothek-Templates sollen alle Artefakte, die dieses Template nutzen, den neuen Prompt-Text übernehmen (dafür wird `artifact.template_id` eingeführt).

## Architektur-Erkenntnisse (Codebase)

| Thema | Befund |
|--------|--------|
| **Phase A · Output** | Gespeichert in `category_phase_outputs` (category_id, phase, output_text, version, status). Anzeige in `PhaseOutputSection` (Workflow-Route). RLS erlaubt bereits DELETE. |
| **Quelle Phase-Output** | Kompiliert aus `artifact_results` (neueste pro Artefakt) + `phase_output_templates` via `compilePhaseOutput`. |
| **Artefakt ↔ Template** | Nur **Kopie**: `artifacts.prompt_template` (TEXT), **kein** `template_id`. Template-Bibliothek = Tabelle `templates`. |
| **Template „verwenden“** | Beim Anlegen: `CreateArtifactWizard` setzt `prompt_template` aus `initialFromTemplate.prompt_template`; keine Referenz gespeichert. |
| **Bearbeiten/Löschen Bibliothek** | Bereits umgesetzt: `TemplateCard` (onEdit/onDelete), `TemplateFormModal`, `useUpdateTemplate`, `useDeleteTemplate`. |
| **Artefakt-Prompt bearbeiten** | Aktuell nur Anzeige/Kopieren in `ArtifactPanel`; kein `useUpdateArtifact`, kein Formular zum Ändern von `prompt_template`. |

## Architektur-Entscheidungen

- **Phase-Output löschen**: Nur Einträge in `category_phase_outputs` für die gewählte Kategorie + Phase löschen (alle Versionen). Die Einzelergebnisse in `artifact_results` bleiben erhalten; Nutzer kann danach erneut „Output generieren“. Optional später: separater Aktions-Button „Phase-X-Ergebnisse löschen“ (artifact_results für Phase-X-Artefakte).
- **Artefakt-Prompt**: Bearbeiten über erweiterbares ArtifactPanel oder kleines „Artefakt bearbeiten“-Modal (name, description, prompt_template). „Löschen“ = „Prompt zurücksetzen“ (leer oder Default-Text).
- **Sync Bibliothek → Artefakte**: Option **Referenz ergänzen**: Migration fügt `artifacts.template_id` (nullable, FK `templates.id`) hinzu. Beim „Template anlegen“ wird `template_id` + Kopie gesetzt. Beim Speichern eines Templates in der Bibliothek: alle Artefakte mit `template_id = id` bekommen `prompt_template` aktualisiert. Beim Löschen eines Templates: `template_id` bei betroffenen Artefakten auf NULL setzen, `prompt_template` bleibt (orphan copy).

---

## Implementierungsschritte

### Phase 1: Phase-A-Output (bzw. beliebige Phase) löschen

#### 1.1 Hook: Phase-Output einer Kategorie+Phase löschen  
**Datei:** `src/hooks/useDeleteCategoryPhaseOutput.ts` (neu)

- **Aktion:** Mutation: Supabase `from('category_phase_outputs').delete().eq('category_id', id).eq('phase', phase)`. RLS erlaubt DELETE bereits (003).
- **Warum:** Zentrale, wiederverwendbare Logik für UI und ggf. spätere Erweiterung.
- **Abhängigkeiten:** Keine.
- **Risiko:** Niedrig.

#### 1.2 PhaseOutputSection: Button „Phase X Output löschen“  
**Datei:** `src/components/PhaseOutputSection.tsx`

- **Aktion:** Wenn `phaseOutput` existiert: zusätzlicher Button „Output löschen“; bei Klick Bestätigungs-Modal (z. B. `ConfirmModal`): „Phase-X-Output für diese Kategorie unwiderruflich löschen? Der Output kann neu generiert werden.“ Nach Bestätigung `useDeleteCategoryPhaseOutput().mutateAsync({ categoryId, phase })`, dann Query-Invalidierung wie bei `useSaveCategoryPhaseOutput` (z. B. `['category_phase_outputs', categoryId]`, `['placeholder-data', categoryId]`).
- **Warum:** UX direkt am Ort der Anzeige („Phase A · Output“).
- **Abhängigkeiten:** Schritt 1.1.
- **Risiko:** Niedrig.

#### 1.3 useDeleteCategoryPhaseOutput: Query-Invalidierung  
**Datei:** `src/hooks/useDeleteCategoryPhaseOutput.ts`

- **Aktion:** `onSuccess`: `queryClient.invalidateQueries({ queryKey: ['category_phase_outputs', variables.categoryId] })` und `['category_phase_outputs', variables.categoryId, variables.phase]` falls verwendet; ggf. `['placeholder-data', variables.categoryId]`, damit Placeholder-Substitution ohne alten Output funktioniert.
- **Warum:** UI zeigt sofort leeren Zustand.
- **Abhängigkeiten:** Schritt 1.1.
- **Risiko:** Niedrig.

---

### Phase 2: Artefakt-Prompt bearbeiten und zurücksetzen

#### 2.1 useUpdateArtifact  
**Datei:** `src/hooks/useUpdateArtifact.ts` (neu)

- **Aktion:** Mutation: Supabase `from('artifacts').update({ name?, description?, prompt_template?, updated_at }).eq('id', id)`. Typen aus `database.types` (ArtifactRow Update). Nach Erfolg: `['artifacts', categoryId]` und `['artifact', artifactId]` (falls vorhanden) invalidieren.
- **Warum:** Artefakt-Metadaten und Prompt müssen änderbar sein, ohne neues Artefakt anzulegen.
- **Abhängigkeiten:** Keine.
- **Risiko:** Niedrig.

#### 2.2 ArtifactPanel: Prompt bearbeitbar machen  
**Datei:** `src/components/ArtifactPanel.tsx`

- **Aktion:** Statt nur Anzeige: Zustand `promptEdit` (boolean) oder direkt bearbeitbares Textarea für `artifact.prompt_template`. Beim Speichern: `useUpdateArtifact(artifact.id).mutate({ prompt_template: value })`. Optional: „Prompt zurücksetzen“-Button (leer oder fest definierter Default), der dasselbe Update mit leerem/Default-Text ausführt.
- **Warum:** Nutzer soll den in Artefakten verwendeten Prompt anpassen können („Bearbeiten“ = am Artefakt).
- **Abhängigkeiten:** Schritt 2.1.
- **Risiko:** Mittel (UX: Unterscheidung Anzeige vs. Bearbeitung, Speichern-Ablauf).

#### 2.3 Optional: Kontextmenü Workflow-Tabelle  
**Datei:** `src/routes/projects/$projectId/categories/$categoryId/index.tsx` oder Tabellen-Komponente

- **Aktion:** Falls gewünscht: Eintrag „Artefakt bearbeiten“ im Kontextmenü/Dropdown pro Zeile, öffnet ArtifactPanel im Bearbeitungsmodus oder separates kleines Modal nur für name/description/prompt_template. Kann in Phase 2 nach 2.2 ergänzt werden.
- **Abhängigkeiten:** 2.1, 2.2.
- **Risiko:** Niedrig.

---

### Phase 3: Template-Bibliothek ↔ Artefakte (Referenz + Sync)

#### 3.1 Migration: template_id an artifacts  
**Datei:** `supabase/migrations/004_artifact_template_id.sql` (neu)

- **Aktion:** `ALTER TABLE artifacts ADD COLUMN template_id UUID REFERENCES templates(id) ON DELETE SET NULL;` (optional Index `idx_artifacts_template_id` für Abfragen „alle Artefakte zu Template X“). Kein NOT NULL, bestehende Artefakte bleiben ohne Referenz.
- **Warum:** Ermöglicht Zuordnung „dieses Artefakt nutzt dieses Bibliothek-Template“ und gezieltes Update bei Template-Änderung.
- **Abhängigkeiten:** Keine.
- **Risiko:** Niedrig.

#### 3.2 database.types.ts anpassen  
**Datei:** `src/types/database.types.ts`

- **Aktion:** In `artifacts` Row/Insert/Update `template_id: string | null` ergänzen (oder per Supabase CLI neu generieren: `supabase gen types typescript`).
- **Abhängigkeiten:** 3.1 (Migration ausgeführt).
- **Risiko:** Niedrig.

#### 3.3 CreateArtifactWizard: template_id setzen  
**Datei:** `src/components/CreateArtifactWizard.tsx`

- **Aktion:** Beim Anlegen mit `initialFromTemplate`: im Insert neben `prompt_template` auch `template_id: initialFromTemplate.id` setzen.
- **Warum:** Neue Artefakte aus Template sind so der Bibliothek zugeordnet und können bei Template-Update mitgezogen werden.
- **Abhängigkeiten:** 3.1, 3.2.
- **Risiko:** Niedrig.

#### 3.4 useUpdateTemplate: Sync in verknüpfte Artefakte  
**Datei:** `src/hooks/useUpdateTemplate.ts`

- **Aktion:** Nach erfolgreichem `templates.update`: Abfrage `from('artifacts').select('id').eq('template_id', input.id)`; für jede artifact_id `from('artifacts').update({ prompt_template: input.prompt_template, updated_at }).eq('id', id)`. Alternativ ein Bulk-Update (Supabase: mehrere Einzel-Updates oder RPC). Danach passende Query-Keys invalidieren (z. B. alle Kategorien der betroffenen Artefakte – oder generisch `['artifacts']`).
- **Warum:** „Wenn ein Prompt-Template in der Template-Bibliothek geändert wird, sollen die Änderungen in den Artefakten übernommen werden.“
- **Abhängigkeiten:** 3.1, 3.2.
- **Risiko:** Mittel (Performance bei vielen Artefakten; Invalidation breit genug wählen).

#### 3.5 useDeleteTemplate: Referenz aufheben  
**Datei:** `src/hooks/useDeleteTemplate.ts`

- **Aktion:** Vor dem Löschen des Templates: `from('artifacts').update({ template_id: null }).eq('template_id', templateId)`. Dann wie bisher `from('templates').delete().eq('id', templateId)`. Invarianten: Artefakte behalten ihre letzte Kopie in `prompt_template`, verlieren nur die Verknüpfung.
- **Warum:** Kein FK-Verstoß; Nutzer behält den zuletzt synchronisierten Prompt-Text.
- **Abhängigkeiten:** 3.1, 3.2.
- **Risiko:** Niedrig.

#### 3.6 Optional: UI-Hinweis „Mit Template verknüpft“  
**Datei:** `src/components/ArtifactPanel.tsx` (oder ArtifactCard in Tabelle)

- **Aktion:** Wenn `artifact.template_id` gesetzt: kleinen Hinweis anzeigen (z. B. „Verknüpft mit Bibliothek-Template“). Beim Bearbeiten des Prompts im Artefakt: optional „Verknüpfung trennen“-Option (setzt `template_id` auf null), damit lokale Änderungen nicht beim nächsten Template-Save überschrieben werden.
- **Abhängigkeiten:** 3.2, 3.3.
- **Risiko:** Niedrig.

---

## Abhängigkeiten zwischen den drei Themen

- **Phase 1** (Phase-Output löschen): unabhängig; kann zuerst umgesetzt werden.
- **Phase 2** (Artefakt-Prompt bearbeiten/löschen): unabhängig von 1 und 3; nur `useUpdateArtifact` + UI.
- **Phase 3** (Sync): baut auf Schema `template_id` auf; Phase 2 profitiert davon, dass es dann „Verknüpfung trennen“ und klare Semantik (Sync vs. lokale Bearbeitung) gibt. Empfohlene Reihenfolge: 1 → 2 → 3, oder 1 und 2 parallel, dann 3.

---

## Teststrategie

- **Unit:** `compilePhaseOutput` und Placeholder-Logik sind bereits getestet; neue Hooks (useDeleteCategoryPhaseOutput, useUpdateArtifact) mit Mock Supabase oder Integration in bestehende Test-Setups prüfen.
- **Manuell:** Phase-Output löschen → Anzeige leer, Neu-Generieren funktioniert; Artefakt-Prompt bearbeiten → Speichern, Reload; Template bearbeiten → verknüpfte Artefakte zeigen neuen Text; Template löschen → Artefakte behalten Text, template_id null.
- **E2E (optional):** Ein Flow „Phase A Output löschen“ und „Template ändern, Artefakt prüfen“.

---

## Risiken und Absicherung

- **Risiko:** Sync (3.4) bei sehr vielen Artefakten pro Template langsam.  
  **Absicherung:** Batch-Updates oder Supabase RPC mit einer UPDATE ... WHERE template_id = $1; nur bei Bedarf optimieren.

- **Risiko:** Nutzer erwartet „Phase A Output löschen“ = auch Einzelergebnisse löschen.  
  **Absicherung:** Klarer Button-Text „Kompilierten Output löschen“; optional zweiten Button „Alle Phase-A-Ergebnisse löschen“ (artifact_results) in Phase 1 ergänzen.

- **Risiko:** Alte Artefakte ohne template_id: Verhalten bei „Template löschen“ ist klar (nur Zeilen mit template_id betroffen). Keine Änderung nötig.

---

## Erfolgskriterien

- [ ] Nutzer kann in der Workflow-Ansicht pro Phase „Phase X · Output löschen“ ausführen; danach ist der kompilierte Output weg, Neu-Generieren möglich.
- [ ] Nutzer kann im Artefakt-Detail den Prompt bearbeiten und speichern sowie „Prompt zurücksetzen“ (oder vergleichbar) ausführen.
- [ ] Beim Speichern eines Bibliothek-Templates werden alle Artefakte mit diesem `template_id` im Feld `prompt_template` aktualisiert.
- [ ] Beim Löschen eines Bibliothek-Templates wird `template_id` bei betroffenen Artefakten auf null gesetzt; `prompt_template` bleibt unverändert.
- [ ] Neue Artefakte aus „Template anlegen“ speichern `template_id`; bestehende bleiben ohne Referenz (optional später manuell verknüpfbar).
- [ ] Lint und Tests (inkl. `npm run test:run`) bestehen.
