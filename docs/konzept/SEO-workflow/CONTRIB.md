# Contributing – SEO Workflow Platform

## Development Workflow

- Branch von `main` erstellen, Änderungen committen, Push und Merge Request (bzw. Pull Request) öffnen.
- Vor dem Push: `npm run lint` und `npm run test` ausführen.
- Code-Reviews nutzen; CI (Lint/Tests) muss grün sein.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Startet den Vite-Entwicklungsserver (Hot Reload). |
| **build** | `npm run build` | TypeScript bauen (`tsc -b`) und Vite-Produktions-Build ausführen. |
| **lint** | `npm run lint` | ESLint für das gesamte Projekt ausführen. |
| **preview** | `npm run preview` | Vite-Preview-Server (lokaler Test des Production-Builds). |
| **test** | `npm run test` | Vitest im Watch-Modus starten. |
| **test:run** | `npm run test:run` | Vitest einmal ausführen (CI-freundlich). |
| **prepare** | `npm run prepare` | Husky-Hooks installieren (wird nach `npm install` ausgeführt). |

*Quelle: `package.json` (Stand der Generierung).*

## Environment Setup

Es ist **keine** `.env.example` im Repository vorhanden. Typische Umgebungsvariablen für eine Vite + Supabase-Anwendung:

| Variable | Purpose | Format/Beispiel |
|----------|---------|------------------|
| `VITE_SUPABASE_URL` | Supabase-Projekt-URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public Key | Langer Base64-String |

Falls genutzt: eigene `.env` (oder `.env.local`) anlegen und **nicht** committen. `.env` in `.gitignore` belassen.

## Testing Procedures

- **Unit/Integration:** `npm run test` bzw. `npm run test:run`.
- Coverage wird über Vitest (v8) erzeugt; Konfiguration in `vite.config.ts` (z. B. `reportsDirectory: './coverage'`).
- Vor Merge: mindestens `npm run test:run` und `npm run lint` lokal ausführen.
