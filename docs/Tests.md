# Tests – Aufsetzen und Ausführen (SEO Workflow)

Kurze Anleitung gemäß [Testing-allgemein.md](./Testing-allgemein.md).

## Voraussetzungen

- **Node.js** (LTS)
- Abhängigkeiten installieren:

```bash
npm install
```

(Vitest steht in `devDependencies`.)

## Tests ausführen

**Einmalig (z. B. vor Commit / in CI):**

```bash
npm run test:run
```

**Watch-Modus (bei Änderungen automatisch):**

```bash
npm test
```

Mit **Strg+C** beenden.

## Tests vor Commit/Push (Git Hooks)

Mit **Husky** laufen die Tests automatisch:

- **Vor jedem Commit** (`pre-commit`): `npm run test:run` – schlägt der Befehl fehl, wird der Commit abgebrochen.
- **Vor jedem Push** (`pre-push`): `npm run test:run` – schlägt der Befehl fehl, wird der Push abgebrochen.

**Einmalig aktivieren:** Nach dem Klonen oder nach Hinzufügen von Husky im Projekt `npm install` ausführen. Der Skript `prepare` richtet die Git-Hooks dann ein.

Überspringen (nur in Ausnahmen): `git commit --no-verify` bzw. `git push --no-verify`.

## Coverage

**Mit Coverage-Report (Schwellen für `src/utils`):**

```bash
npm run test:run -- --coverage
```

- **Schwellen:** Statements/Branches/Functions/Lines für `src/utils` mind. 80 % (Branches 70 %).
- Report: `coverage/` (HTML: `coverage/index.html`).

## Getestete Bereiche

| Datei | Inhalt |
|-------|--------|
| `src/utils/replacePlaceholders.test.ts` | Platzhalter-Ersetzung ([KATEGORIE], [ZIELGRUPPEN], dependencyMap) |
| `src/utils/exportCategory.test.ts` | Markdown-Export und kombinierte Ergebnis-Texte |
| `src/utils/createDefaultArtifacts.test.ts` | `buildArtifactsFromTemplates`, Standard-Artefakte (Category/Blog), `getDefaultArtifactsForCategory` |

Alle Tests laufen in der **Node**-Umgebung (kein Browser). Supabase wird in diesen Unit-Tests nicht aufgerufen.
