# Runbook – SEO Workflow Platform

## Deployment Procedures

- **Build:** `npm run build` (erzeugt z. B. `dist/`).
- **Hosting:** Typisch statischer Export (Vite) auf Vercel, Netlify oder anderem Static-Host. Deployment erfolgt über Git-Integration (Push auf `main` bzw. Production-Branch) oder manuelles Hochladen von `dist/`.
- Nach dem Deploy: erreichbare URL und ggf. Umgebungsvariablen (z. B. `VITE_SUPABASE_*`) auf dem Host prüfen.

## Monitoring and Alerts

- Keine projektspezifischen Monitoring-/Alert-Anweisungen hinterlegt. Empfehlung: Host-Monitoring (Uptime, Fehlerquoten) und ggf. Error-Tracking (z. B. Sentry) nutzen.
- Bei Supabase-Backend: Supabase Dashboard für DB-/API-Status und Logs prüfen.

## Common Issues and Fixes

| Issue | Fix |
|-------|-----|
| Build schlägt fehl (`tsc` oder Vite) | `npm run build` lokal prüfen; TypeScript- und Lint-Fehler beheben. |
| Tests schlagen fehl | `npm run test:run` lokal ausführen; fehlende Umgebungsvariablen oder Mocks prüfen. |
| Lint-Fehler | `npm run lint`; Regeln in ESLint-Konfiguration anpassen oder Code anpassen. |
| Supabase nicht erreichbar / 401 | `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` prüfen; CORS und Anon-Key-Rollen im Supabase-Dashboard prüfen. |

## Rollback Procedures

- **Host mit Git-Integration:** Vorherigen Commit deployen (Revert oder Re-Deploy eines älteren Commits).
- **Manuell:** Vorherige `dist/`-Version erneut hochladen bzw. vorherigen Build-Artefakt deployen.
- Datenbank-Rollbacks: nur bei migrationsbasierten Änderungen; Backups und Supabase-Migrations-Historie beachten.
