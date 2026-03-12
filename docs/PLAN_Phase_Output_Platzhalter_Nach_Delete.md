# Implementierungsplan: [INPUT A] nach Löschen des Phase-Outputs leer (kein Geister-Wert)

## Anforderung (präzisiert)

Nach dem Löschen des **Phase-Outputs** (z. B. Phase A · Output) soll der Platzhalter **[INPUT A]** (bzw. [INPUT B] … [INPUT X]) in der Template-Anzeige und -Bearbeitung **leer** sein bzw. als „fehlt“ gelten – es darf **kein** alter Wert aus Cache oder einer anderen Quelle mehr erscheinen. **Ausnahme:** Existiert für eine Phase ein Eintrag in `category_phase_outputs`, soll genau dieser kompilierte Output für den jeweiligen Platzhalter verwendet werden. Kurz: Quelle für Phasen-Platzhalter ist ausschließlich `category_phase_outputs`; fehlt ein Eintrag (z. B. nach Delete), ist der Platzhalter leer.

---

## Ist-Zustand: Woher kommen [INPUT A] und Phasen-Outputs für die Platzhalter-Ersetzung?

### Datenfluss

1. **`usePlaceholderData(categoryId)`** (Datei: `src/hooks/usePlaceholderData.ts`)
   - Query-Key: **`['placeholder-data', categoryId]`**
   - Lädt in einer Query-Funktion:
     - Kategorie + Hub, `custom_placeholders`
     - **`fetchPlaceholderData(categoryId)`** → Artefakte + aus **`artifact_results`** die neueste `result_text` pro Artefakt (`latestByArtifactId`)
     - **`buildDependencyMap(artifacts, latestByArtifactId)`** baut eine Map u. a. mit:
       - **`[INPUT A]` … `[INPUT X]`** = Konkatenation aller Ergebnisse der jeweiligen Phase (aus `artifact_results` über `latestByArtifactId`)
       - `[INPUT A1]`, `[INPUT B2]` usw., `[BRIEFING]` (C1), `[TEXT]` (D1), `[LINKS]` (B2/B2.1)
     - Danach: Abfrage **`category_phase_outputs`** für diese `category_id`, nach `version` absteigend. Für **jede Phase mit Eintrag** wird `dependencyMap['[INPUT ${phase}]'] = row.output_text` gesetzt (und ggf. `[BRIEFING]`/`[TEXT]` aus C/D/E).
   - **Problem:** Phasen **ohne** Eintrag in `category_phase_outputs` werden **nicht** explizit geleert. Der von `buildDependencyMap` aus **artifact_results** gesetzte Wert für `[INPUT A]` bleibt also erhalten → **Geister-Wert** nach Löschen des Phase-Outputs.

2. **`replacePlaceholders(template, category, placeholderMap)`** (Datei: `src/utils/replacePlaceholders.ts`)
   - Ersetzt Platzhalter ausschließlich aus der übergebenen **`placeholderMap`** (und Kategorie-Metadaten). Es gibt keine zweite Quelle oder eigenen Cache; die Map kommt von `usePlaceholderData`.

3. **Verwendung von `placeholderMap`**
   - **ArtifactPanel**: `usePlaceholderData(artifact.category_id)` → `replacePlaceholders(..., placeholderMap)` für die Prompt-Vorschau.
   - **PromptEditor**: `usePlaceholderData(categoryId)` → Platzhalter-Preview.
   - **Route** `projects/$projectId/categories/$categoryId/index.tsx`: `usePlaceholderData(categoryId)` → z. B. für aufgelöste Prompts.
   - **ExportModal**: `usePlaceholderData(categoryId)` → aufgelöste Prompts beim Export.

4. **Löschen des Phase-Outputs**
   - **`useDeleteCategoryPhaseOutput`** (Datei: `src/hooks/useDeleteCategoryPhaseOutput.ts`): DELETE auf `category_phase_outputs` für `category_id` + `phase`. In **`onSuccess`** werden invalidiert:
     - **`['category_phase_outputs', variables.categoryId]`** (trifft auch `useCategoryPhaseOutput(categoryId, phase)` und `useCategoryPhaseOutputs(categoryId)` wegen Präfix-Match)
     - **`['placeholder-data', variables.categoryId]`**
   - Damit wird **placeholder-data** für die Kategorie korrekt neu ausgelöst; das Problem ist nicht fehlende Invalidierung, sondern die **Logik beim erneuten Befüllen** der Map (siehe oben).

5. **Weitere Caches**
   - Kein separater Cache außer TanStack Query. `useCategoryPhaseOutput(categoryId, phase)` nutzt `['category_phase_outputs', categoryId, phase]` und wird durch die Invalidierung von `['category_phase_outputs', categoryId]` mit refetcht. Die einzige Stelle, die „alte“ Werte liefern kann, ist die **Reihenfolge in usePlaceholderData**: zuerst `buildDependencyMap` (artifact_results), dann Überschreiben nur wo `category_phase_outputs` existiert – fehlt der Eintrag, bleibt der Wert aus artifact_results.

---

## Risiken

- **Race nach Delete:** Delete-Mutation und Refetch von `placeholder-data` laufen asynchron. Wenn die UI den Platzhalterwert vor dem Abschluss des Refetches anzeigt, könnte kurz noch der alte Cache-Wert sichtbar sein. Mit korrekter Logik (siehe unten) liefert der **nächste** Fetch dann leere Phasen-Platzhalter; ggf. nach Delete gezielt `refetch` für `placeholder-data` auslösen, um UI schneller zu aktualisieren.
- **Andere Komponenten:** Alle nutzen dieselbe Quelle `usePlaceholderData` → gleiche Map. Eine Anpassung in `usePlaceholderData` wirkt überall (ArtifactPanel, PromptEditor, Export, Route).
- **Tests:** `usePlaceholderData.test.ts` und `replacePlaceholders.test.ts` bauen teils auf `buildDependencyMap` und [INPUT A] aus Artefakt-Ergebnissen. Sollen Phasen-Platzhalter [INPUT A] … [INPUT X] **nur** aus `category_phase_outputs` kommen, müssen Tests angepasst werden (z. B. Szenario „Phase-Output gelöscht“ → [INPUT A] leer; ggf. getrennte Tests für „mit category_phase_outputs“ vs. „ohne“).
- **Abwärtskompatibilität:** Kategorien ohne jemals gespeicherten Phase-Output verhalten sich heute so, dass [INPUT A] aus artifact_results kommt. Nach der Änderung: [INPUT A] leer, wenn kein Eintrag in `category_phase_outputs`. Das entspricht der gewünschten Regel („nur Template / kein alter Output“).

---

## Implementierungsschritte (Phasen)

### Phase 1: Platzhalter-Logik – Phasen-Platzhalter nur aus category_phase_outputs; bei Fehlen leer

**Ziel:** Nach Löschen (oder nie vorhanden) eines Phase-Outputs liefert die Platzhalter-Map für [INPUT A] … [INPUT X] keinen Wert aus artifact_results mehr, sondern explizit leer.

1. **usePlaceholderData – Phasen-Platzhalter nach category_phase_outputs explizit setzen/leeren** (Datei: `src/hooks/usePlaceholderData.ts`)
   - **Aktion:** Nach der bestehenden Schleife über `phaseOutputRows`: Für **jede** Phase in der festen Liste (A, B, C, D, E, F, G, X) prüfen, ob ein Eintrag in `category_phase_outputs` verwendet wurde (z. B. über `seenPhases`). Für jede Phase **ohne** solchen Eintrag: `dependencyMap['[INPUT ${phase}]'] = ''` setzen (explizit leeren), damit der von `buildDependencyMap` aus artifact_results kommende Wert überschrieben wird.
   - **Begründung:** So ist die einzige Quelle für [INPUT A] … [INPUT X] der kompilierte Phase-Output; fehlt er, bleibt der Platzhalter leer.
   - **Abhängigkeiten:** Keine.
   - **Risiko:** Gering.

2. **Optional, konsistent:** [BRIEFING] und [TEXT] nur aus category_phase_outputs (C / E bzw. D)
   - **Aktion:** Wenn gewünscht, gleiche Regel: Kein Eintrag für C → `[BRIEFING] = ''`; kein Eintrag für E/D (je nach Logik) → `[TEXT] = ''`. Sonst können nach Löschen von Phase C bzw. D/E weiterhin Werte aus artifact_results (C1, D1) erscheinen. In der gleichen Datei/Stelle umsetzbar.
   - **Begründung:** Einheitliches Verhalten: Alle aus Phase-Output abgeleiteten Platzhalter haben eine einzige Quelle (category_phase_outputs); bei Fehlen leer.
   - **Abhängigkeiten:** Optional, kann mit Schritt 1 zusammengefasst werden.
   - **Risiko:** Gering; evtl. Anpassung in Tests für [BRIEFING]/[TEXT].

### Phase 2: Invalidierung und Refetch (bereits weitgehend vorhanden; ggf. verstärken)

3. **Sicherstellen, dass beim Löschen alle relevanten Queries invalidiert werden**
   - **Ist:** `useDeleteCategoryPhaseOutput` invalidiert bereits `['category_phase_outputs', categoryId]` und `['placeholder-data', categoryId]`.
   - **Aktion:** Prüfen, ob es weitere Stellen gibt, die `category_phase_outputs` oder Platzhalter-Daten cachen (z. B. andere Query-Keys). Bisher: keine. Optional: Nach erfolgreichem Delete in der aufrufenden Komponente (z. B. PhaseOutputSection) gezielt `queryClient.invalidateQueries({ queryKey: ['placeholder-data', categoryId] })` oder `refetch` des placeholder-data-Queries auslösen, damit die UI sofort aktualisiert wird (redundant zur Mutation onSuccess, kann aber Race minimieren).
   - **Dateien:** `src/hooks/useDeleteCategoryPhaseOutput.ts`, ggf. `src/components/PhaseOutputSection.tsx`.
   - **Risiko:** Gering.

4. **replacePlaceholders: Keine Änderung nötig**
   - **Aktion:** Keine. Es wird weiter nur die übergebene `placeholderMap` verwendet; fehlende oder leere Werte werden durch die bestehende Logik (Fallback auf Platzhalter-Name oder leeren String) abgedeckt. Sicherstellen, dass ein leerer String in der Map für `[INPUT A]` dazu führt, dass im Template tatsächlich nichts bzw. der gewünschte „fehlt“-Ausdruck erscheint (evtl. in replacePlaceholders oder in der UI „(fehlt)“ anzeigen, wenn Wert leer – nur prüfen, ob gewünscht).
   - **Dateien:** `src/utils/replacePlaceholders.ts`, ggf. UI-Komponenten die den aufgelösten Prompt anzeigen.
   - **Risiko:** Gering.

### Phase 3: Tests und Randfälle

5. **Unit-Tests usePlaceholderData**
   - **Aktion:** In `src/hooks/usePlaceholderData.test.ts` (oder integriert in die Query-Fn): Szenario ergänzen: Kein Eintrag in `category_phase_outputs` für Phase A, aber artifact_results liefern Phase-A-Ergebnisse → erwartete Map soll `[INPUT A] === ''` (oder definierter „fehlt“-Wert) haben, nicht den aus artifact_results. Bestehende Tests, die [INPUT A] aus artifact_results erwarten, anpassen oder doppeln (mit/ohne category_phase_outputs).
   - **Datei:** `src/hooks/usePlaceholderData.test.ts`.
   - **Risiko:** Mittel (Test-Struktur/Mocking der Supabase-Abfragen).

6. **replacePlaceholders / Integration**
   - **Aktion:** In `src/utils/replacePlaceholders.test.ts` prüfen: Wenn `dependencyMap['[INPUT A]'] = ''`, wird im Ergebnis [INPUT A] durch leeren String ersetzt (oder gewünschter Platzhalter-Text). Ggf. einen Test hinzufügen: „[INPUT A] leer in Map → wird ersetzt durch '' “.
   - **Datei:** `src/utils/replacePlaceholders.test.ts`.
   - **Risiko:** Gering.

---

## Abhängigkeiten zwischen Schritten

- **Phase 1 (Schritt 1, ggf. 2)** ist die zentrale Änderung und unabhängig.
- **Phase 2 (Schritt 3–4)** kann parallel oder danach erfolgen; Schritt 4 ist reine Prüfung/evtl. kleine UI-Anpassung.
- **Phase 3 (Schritt 5–6)** baut auf der neuen Semantik auf und sollte nach Phase 1 laufen.

---

## Konkrete Dateien und Hooks (Kurzreferenz)

| Was | Datei / Hook |
|-----|----------------|
| Quelle [INPUT A] / Platzhalter-Map | `src/hooks/usePlaceholderData.ts` (queryFn: fetchPlaceholderData, buildDependencyMap, category_phase_outputs-Schleife) |
| Ersetzung im Template | `src/utils/replacePlaceholders.ts` (nutzt nur übergebene Map) |
| Löschen Phase-Output + Invalidierung | `src/hooks/useDeleteCategoryPhaseOutput.ts` (onSuccess: category_phase_outputs, placeholder-data) |
| Abfrage einzelner Phase-Output | `src/hooks/useCategoryPhaseOutput.ts` (Key: category_phase_outputs, categoryId, phase) |
| Alle Phase-Outputs einer Kategorie | `src/hooks/useCategoryPhaseOutputs.ts` (Key: category_phase_outputs, categoryId) |
| Consumer der placeholderMap | ArtifactPanel, PromptEditor, ExportModal, Route index (categories/$categoryId) |
| Tests | `src/hooks/usePlaceholderData.test.ts`, `src/utils/replacePlaceholders.test.ts` |

---

## Erfolgskriterien

- [ ] Nach Löschen des Phase-Outputs (z. B. Phase A) zeigt die Prompt-Vorschau/Template-Bearbeitung **[INPUT A]** als leer bzw. „fehlt“, nicht den vorherigen Output oder einen Wert aus artifact_results.
- [ ] Wenn für eine Phase ein Eintrag in `category_phase_outputs` existiert, wird [INPUT A] (bzw. die entsprechende Phase) wie bisher mit diesem Output befüllt.
- [ ] Kein Geister-Wert aus Cache: Nach Delete wird `placeholder-data` invalidiert und beim nächsten Abruf liefert die Logik für Phasen ohne Eintrag explizit leere Werte.
- [ ] Bestehende Tests angepasst/erweitert; neue Semantik (leer bei fehlendem Phase-Output) abgedeckt.
