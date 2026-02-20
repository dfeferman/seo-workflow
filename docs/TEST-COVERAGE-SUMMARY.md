# Test-Coverage – Zusammenfassung

## Aktueller Stand (nach /test-coverage)

**Bereich:** `src/utils/**/*.ts` (Coverage-Include in `vite.config.ts`)

| Metrik     | Vorher (nur bestehende Tests) | Nachher (mit buildArtifactsFromTemplates-Tests) | Schwellen |
|-----------|--------------------------------|--------------------------------------------------|-----------|
| Statements| 81,81 %                        | **100 %**                                        | ≥ 80 %    |
| Branches  | 78,12 %                        | **71,42 %**                                      | ≥ 70 %    |
| Functions | 85,71 %                        | **100 %**                                        | ≥ 80 %    |
| Lines     | 81,81 %                        | **100 %**                                        | ≥ 80 %    |

- **Tests:** 23 → **33** (+10 für `buildArtifactsFromTemplates`).
- **createDefaultArtifacts.ts:** vorher 62,66 % Statements (Zeilen 13–40 ungetestet), nachher **100 %** Statements/Lines/Funcs.

## Durchgeführte Schritte

1. **Coverage eingerichtet:** `@vitest/coverage-v8`, in `vite.config.ts`: `coverage.provider: 'v8'`, `include: ['src/utils/**/*.ts']`, `thresholds` (80/70/80/80).
2. **Lücken analysiert:** `buildArtifactsFromTemplates` war nicht getestet.
3. **Neue Tests in createDefaultArtifacts.test.ts:**
   - Leere Template-Liste → leeres Array
   - Ein gültiges Template → ein Artefakt mit category_id, display_order
   - Ungültige Phase (z. B. `Z`, leer) → gefiltert
   - Phase wird großgeschrieben (`c` → `C`)
   - Fallback `artifact_code` wenn null/leer
   - Fallback `name` „Unbenannt“ wenn leer
   - Leerer `prompt_template`
   - Sortierung nach Phase, dann `created_at`
   - Fortlaufende `display_order` 0, 1, 2, …
   - Kein `id`/`created_at`/`updated_at` (Insert-Format)
4. **Dokumentation:** `docs/Tests.md` um Coverage-Abschnitt ergänzt.

## Ausführen

```bash
npm run test:run -- --coverage
```

HTML-Report: `coverage/index.html`.

## Hinweis

Components, Hooks und Routes sind von der Coverage-Auswertung ausgenommen (`include` nur `src/utils`). Für 80 %+ Gesamt-Coverage müssten dort weitere Unit- oder Integrationstests ergänzt werden.
