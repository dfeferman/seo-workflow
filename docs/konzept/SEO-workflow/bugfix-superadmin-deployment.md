# Bugfix: Superadmin / Nutzerverwaltung nach Deployment nicht sichtbar

## Problem

Nach dem Deployment auf dem NAS-Server via GitHub CI/CD war die **Nutzerverwaltung** (Nutzer verwalten-Button in der Sidebar) für den Superadmin-Account `d.feferman@adebo-medical.de` nicht sichtbar — obwohl sie lokal korrekt funktionierte.

---

## Root Cause Analyse

### Wie Superadmin-Status ermittelt wird (3 Schichten)

1. **`SUPERADMIN_EMAILS` Umgebungsvariable** — überstimmt das DB-Flag (war in Production nicht gesetzt)
2. **`is_superadmin` Spalte in der DB** — war `FALSE` in Production
3. **`bootstrapSuperadminIfMissing()`** — läuft nur beim ersten User, wenn noch kein Superadmin existiert

### Warum es lokal funktionierte
Beim ersten lokalen Login wurde `bootstrapSuperadminIfMissing()` ausgelöst → Account automatisch als Superadmin markiert.

### Warum es in Production nicht funktionierte
- Production-DB hatte bereits User-Einträge → Bootstrap wurde nicht ausgelöst
- Migration `005_grant_superadmin_feferman.sql` wurde nie auf der Production-DB ausgeführt
- `SUPERADMIN_EMAILS` war nicht in der Production `.env` gesetzt
- Der NAS lief noch auf einem **alten Docker-Image** (ohne `is_superadmin` im API-Response)
- `is_approved` war ebenfalls `FALSE` — blockiert Zugang vor dem Superadmin-Check

### Diagnose-Befehl (Network Tab)
`GET /api/auth/me` lieferte nur:
```json
{
  "id": "...",
  "email": "d.feferman@adebo-medical.de",
  "created_at": "..."
}
```
→ Kein `is_superadmin` Feld → altes Image bestätigt

---

## Durchgeführte Fixes

### Fix 1: DB-Flags direkt gesetzt (Portainer Console → Postgres-Container)

```sql
UPDATE users
SET is_superadmin = TRUE,
    is_approved = TRUE
WHERE lower(trim(email)) = 'd.feferman@adebo-medical.de';
```

Verifiziert mit:
```sql
SELECT email, is_superadmin, is_approved
FROM users
WHERE lower(email) = 'd.feferman@adebo-medical.de';
```
→ Ergebnis: `is_superadmin = t`, `is_approved = t` ✅

### Fix 2: Migrations-Runner implementiert

Neue Datei `server/db/migrate.ts` — läuft automatisch beim App-Start:
- Liest alle `*.sql` aus `server/db/migrations/` alphabetisch
- Tracking via `schema_migrations`-Tabelle (wird automatisch angelegt)
- Bereits angewendete Migrationen werden übersprungen (idempotent)
- Bei Fehler: Rollback + App-Start wird abgebrochen

`server/index.ts` angepasst — `runMigrations()` läuft vor `app.listen()`.

### Fix 3: `.env.example` dokumentiert

`SUPERADMIN_EMAILS`-Hinweis für NAS/Production ergänzt:
```
SUPERADMIN_EMAILS=d.feferman@adebo-medical.de
```

---

## Offener Schritt: Docker-Image auf NAS aktualisieren

Das neue Image (mit `is_superadmin` im API-Response + Migrations-Runner) liegt in der GitHub Container Registry, wurde aber noch nicht auf den NAS gezogen.

### Problem beim Update
Portainer meldet beim Recreate:
```
unauthorized: Head "https://ghcr.io/v2/dfeferman/seo-workflow/manifests/latest"
```
→ Docker-Daemon hat alte/ungültige GHCR-Credentials gecacht.

### Lösung

**Option A — Alte Credentials löschen (SSH auf NAS-Host):**
```sh
docker logout ghcr.io
docker pull ghcr.io/dfeferman/seo-workflow:latest
```

**Option B — In Portainer unter Registries:**
- Vorhandenen `ghcr.io`-Eintrag löschen
- Danach Recreate im Container erneut versuchen

**Option C — GHCR Token hinterlegen:**
1. GitHub → Settings → Developer settings → Personal access tokens → `read:packages`
2. Portainer → Registries → Add registry → `ghcr.io` + Token eintragen

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `server/db/migrate.ts` | Neu erstellt — Migrations-Runner |
| `server/index.ts` | `runMigrations()` vor `app.listen()` eingebunden |
| `.env.example` | `SUPERADMIN_EMAILS` für Production dokumentiert |
| `server/db/migrations/005_grant_superadmin_feferman.sql` | Existiert bereits — wird künftig automatisch via Migrations-Runner angewendet |

---

## Zukünftige Deployments

Nach dem erfolgreichen Image-Update auf dem NAS:
- Der Migrations-Runner führt beim nächsten App-Start alle noch nicht angewendeten Migrationen automatisch aus
- `005_grant_superadmin_feferman.sql` wird automatisch ausgeführt → `is_superadmin = TRUE` dauerhaft in DB gesetzt
- `SUPERADMIN_EMAILS` in der `.env` auf dem NAS bleibt als zusätzliche Absicherung

---

## Deployment-Workflow (aktuell)

```
git push → GitHub Actions → Docker Image bauen → Push zu ghcr.io/dfeferman/seo-workflow:latest
                                                              ↓
                                                   NAS: manuell Image pullen
                                                   (Portainer → Recreate)
```

> **TODO:** CI/CD-Workflow um automatisches Deploy auf NAS erweitern (z.B. via SSH-Step in `deploy.yml`)
