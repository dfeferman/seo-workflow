# Code-Review-Report – SEO-workflow

**Datum:** 2026-02-20  
**Scope:** Gesamte Codebase `src/` (Security, Code-Qualität, Best Practices)

---

## Zusammenfassung

| Schweregrad | Anzahl | Commit blockiert? |
|-------------|--------|--------------------|
| CRITICAL    | 0      | –                  |
| HIGH        | 0      | Nein (behoben)     |
| MEDIUM      | 2      | Nein               |
| LOW         | 2      | Nein               |

**Ergebnis:** Commit aus Review-Sicht freigegeben. Keine Sicherheitslücken gefunden.

---

## CRITICAL – Keine

- **Credentials:** Keine hardcodierten API-Keys/Secrets; Supabase nutzt `import.meta.env.VITE_SUPABASE_*`, `.env` steht in `.gitignore`.
- **SQL-Injection:** Keine Raw-SQL-Strings; ausschließlich Supabase-Client (`.from().select().eq().insert()` etc.) mit parametrisierten Aufrufen; RLS auf Server-Seite.
- **XSS:** Kein `dangerouslySetInnerHTML`, kein `innerHTML`, kein `eval()`.
- **Path Traversal:** Keine dateisystembasierten User-Input-Pfade geprüft (nicht relevant für aktuellen App-Umfang).

---

## HIGH

### 1. Fehlende Fehlerbehandlung bei Supabase-Aufrufen

| Datei | Zeilen | Beschreibung |
|-------|--------|--------------|
| `src/components/SubcategoryList.tsx` | 45–56, 65–72 | `handleAdd` und `handleDelete` werten `error` der Supabase-Antwort nicht aus. Bei Fehlern (z. B. RLS, Netzwerk) wird trotzdem invalidiert und UI als erfolgreich dargestellt. |

**Vorschlag:**  
`const { error } = await supabase.from('categories').insert(...)` bzw. `.delete(...)` auswerten; bei `error` den Fehler anzeigen (z. B. State `addError`/`deleteError`), nicht invalidieren und Modal/State zurücksetzen erst bei Erfolg.

**Status:** Behoben. `SubcategoryList.tsx` wertet `error` aus und zeigt `addError`/`deleteError` in den Modals an; beim Schließen werden die Fehler zurückgesetzt.

---

## MEDIUM

### 1. Keine clientseitige E-Mail-Validierung (Login/Signup)

| Datei | Beschreibung |
|-------|--------------|
| `src/routes/login.tsx`, `src/routes/signup.tsx` | E-Mail wird ungeprüft an Supabase übergeben. Supabase validiert serverseitig; Nutzer bekommt erst nach Request eine Fehlermeldung. |

**Vorschlag:** Optionale, einfache Formatprüfung (z. B. Regex oder `input type="email"` + `checkValidity()`) vor dem Submit, um unnötige Requests und unklare Fehler zu reduzieren.

### 2. Console-Ausgaben in Produktion

| Datei | Zeile | Beschreibung |
|-------|--------|--------------|
| `src/lib/supabase.ts` | 7–9 | `console.warn` bei fehlenden Env-Variablen – läuft auch in Produktion. |
| `src/components/ErrorBoundary.tsx` | 27 | `console.error` in `componentDidCatch` – für Error-Boundaries üblich, kann in Prod gewollt sein. |

**Vorschlag:** Supabase-Warnung nur in Development ausgeben (`import.meta.env.DEV`). ErrorBoundary-`console.error` beibehalten oder durch strukturiertes Logging ersetzen, wenn vorhanden.

---

## LOW

### 1. JSDoc für öffentliche APIs

Einige Hooks und Utils (z. B. `usePlaceholderData`, `replacePlaceholders`, `buildArtifactsFromTemplates`) haben keine JSDoc-Kurzbeschreibung für Parameter und Rückgabewerte. Optional ergänzen, um Wartbarkeit und IDE-Support zu verbessern.

### 2. Tags-Liste: Key-Prop

| Datei | Zeile | Beschreibung |
|-------|--------|--------------|
| `src/components/CategorySettingsTabs.tsx` | 47 | `TagsField`: `key={i}` bei den Tag-Chips. Bei reinem Hinzufügen/Entfernen ohne Sortierung meist unkritisch; bei zukünftiger Sortierung besser stabilen Key (z. B. `tag`-Wert) nutzen. |

---

## Positiv

- Konsequente Fehlerbehandlung bei den meisten Supabase-Aufrufen (Hooks: `useCreateCategory`, `useDeleteCategory`, `useArtifactResults`, …).
- Keine TODO/FIXME/HACK-Kommentare in `src/`.
- ErrorBoundary mit nutzerfreundlicher Fallback-UI und `role="alert"`.
- Passwörter nur in State, Übertragung über Supabase Auth (kein eigenes Logging von Passwörtern).
- TypeScript-Typen (u. a. `database.types.ts`) für Datenmodell genutzt.

---

## Nächste Schritte

1. **HIGH:** Fehlerbehandlung in `SubcategoryList.tsx` ergänzen (siehe Patch unten).
2. **MEDIUM:** Optional E-Mail-Validierung und Reduzierung von Console-Ausgaben in Prod.
3. **LOW:** Optional JSDoc und stabilere Keys in Listen.

Nach Umsetzung von Punkt 1 ist der Commit aus Sicht dieses Reviews freigegeben.
