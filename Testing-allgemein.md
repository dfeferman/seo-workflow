# Tests in Projekten – Allgemeine Anleitung

Kurze Übersicht: Wie du Tests in (JavaScript/TypeScript-)Projekten aufsetzt und ausführst – unabhängig vom konkreten Projekt.

---

## 1. Warum testen?

- **Regressionen vermeiden:** Änderungen brechen nichts Unerwartetes.
- **Refactoring absichern:** Logik umbauen ohne Angst.
- **Dokumentation:** Tests zeigen, wie Code sich verhalten soll.
- **Schnelleres Feedback:** Fehler fallen vor dem Deploy auf.

---

## 2. Arten von Tests

| Art | Was wird getestet? | Typische Tools |
|-----|--------------------|----------------|
| **Unit** | Einzelne Funktionen/Module isoliert | Vitest, Jest |
| **Integration** | Mehrere Module zusammen (z. B. API + DB) | Vitest, Jest, Supertest |
| **Komponenten** | UI-Komponenten (React/Vue etc.) | Vitest + Testing Library |
| **E2E** | Ganzer Ablauf im Browser | Playwright, Cypress |

Für den Einstieg reichen **Unit-Tests** für die wichtigste Logik.

---

## 3. Test-Framework wählen

- **Vitest:** Schnell, Vite-freundlich, moderne API. Gute Wahl für Vite/React/Vue.
- **Jest:** Sehr verbreitet, viele Beispiele, oft mit Create-React-App oder älteren Setups.
- **Node.js built-in `test` (ab Node 20):** Ohne Extra-Dependency, für reine Node-Projekte.

Für **Vite-Projekte** ist Vitest meist die einfachste Option.

---

## 4. Aufsetzen (Schritt für Schritt)

### 4.1 Framework installieren

**Vitest (z. B. in einem Vite-Projekt):**

```bash
npm install -D vitest
```

**Jest (klassisches Setup):**

```bash
npm install -D jest @types/jest
```

### 4.2 Test-Skript in `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- `npm test` → Watch-Modus (läuft bei Dateiänderungen weiter).
- `npm run test:run` → Einmal ausführen (z. B. für CI).

### 4.3 Konfiguration (falls nötig)

**Vitest:** Oft keine eigene Config nötig; nutzt `vite.config.js`. Optional z. B. `vitest.config.js` für Test-spezifische Einstellungen (Environment, Globals, Coverage).

**Jest:** Typisch `jest.config.js` mit z. B. `testEnvironment: 'node'` oder `'jsdom'` für Browser-API.

### 4.4 Wo liegen die Tests?

Üblich ist eine von zwei Varianten:

- **Neben dem Code:** `src/utils/foo.js` → `src/utils/foo.test.js` (oder `.spec.js`).
- **Zentral:** Alle Tests in einem Ordner `tests/` oder `__tests__/`.

Projektweit einheitlich halten.

---

## 5. Tests schreiben (Grundmuster)

### 5.1 Einfacher Test (Vitest/Jest)

```javascript
import { describe, it, expect } from 'vitest';
import { meineFunktion } from './meinModul';

describe('meineFunktion', () => {
  it('berechnet das Ergebnis korrekt', () => {
    expect(meineFunktion(2, 3)).toBe(5);
  });

  it('behandelt Randfälle', () => {
    expect(meineFunktion(0, 0)).toBe(0);
  });
});
```

- **`describe`:** Gruppierung (Modul/Funktion).
- **`it`:** Ein einzelner Testfall.
- **`expect(...).toBe(...)`:** Erwartung (Assertion).

### 5.2 Abhängigkeiten mocken

Wenn eine Funktion z. B. eine API oder DB nutzt, diese in Tests ersetzen:

**Vitest:**

```javascript
import { vi } from 'vitest';

vi.mock('./api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ ok: true })),
}));
```

So testest du nur deine Logik, nicht das echte Netzwerk oder die DB.

### 5.3 Typische Assertions

- `expect(x).toBe(y)` – strikte Gleichheit (`===`).
- `expect(x).toEqual(y)` – „tiefe“ Gleichheit (z. B. Objekte/Arrays).
- `expect(x).toBeNull()`, `expect(x).toBeDefined()`.
- `expect(array).toContain(item)`.
- `expect(fn).toThrow()`.

---

## 6. Tests ausführen

```bash
# Einmal alle Tests
npm run test:run

# Watch-Modus (läuft dauerhaft)
npm test
```

In vielen IDEs (z. B. VS Code) lassen sich Tests über die Test-Explorer-UI starten und Ergebnisse anzeigen.

---

## 7. Tests vor Commit/Push (Git Hooks)

Damit vor jedem **Commit** oder **Push** automatisch getestet wird:

1. **Husky** installieren: `npm install -D husky`
2. **Prepare-Skript** in `package.json`: `"prepare": "husky"`
3. **Hooks anlegen** (im Ordner `.husky/`):
   - **pre-commit:** z. B. `npm run test:run` (und optional `npm run lint`)
   - **pre-push:** z. B. `npm run test:run`
4. Nach dem ersten Mal (oder nach Klonen): `npm install` ausführen – dann setzt `prepare` die Git-Hooks.

Wenn die Tests fehlschlagen, werden Commit bzw. Push abgebrochen. Zum bewussten Überspringen: `git commit --no-verify` / `git push --no-verify`.

---

## 8. Tests in CI (z. B. GitHub Actions)

Typischer Schritt in der Pipeline:

```yaml
- run: npm ci
- run: npm run test:run
```

Wenn dieser Schritt fehlschlägt, bricht der Build/Deploy ab – nur getesteter Code geht live.

---

## 9. Kurz-Checkliste für ein neues Projekt

1. Test-Framework installieren (`vitest` oder `jest`).
2. Skript in `package.json` eintragen (`test`, ggf. `test:run`).
3. Konfiguration anpassen (Environment, Pfade), falls nötig.
4. Ersten Test für eine zentrale Funktion schreiben und `npm run test:run` ausführen.
5. Konvention für Dateinamen und Ordner festlegen.
6. In CI den Test-Befehl einbauen.

---

## 10. Weitere Ressourcen

- [Vitest – Dokumentation](https://vitest.dev/)
- [Jest – Dokumentation](https://jestjs.io/)
- [Testing Library (React)](https://testing-library.com/react) für Komponententests
