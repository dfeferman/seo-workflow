# Konzept – Eigenes Backend für seo-workflow

---

## Was wir bauen

```
vorher:                          nachher:
React → Supabase API             React → Eigenes Backend → PostgreSQL
React → Supabase Auth            React → Eigenes Backend → PostgreSQL (users-Tabelle)
```

---

## Tech-Stack

| Was | Tool | Warum |
|---|---|---|
| Server | **Express** | Minimal, weit verbreitet, schnell aufgesetzt |
| DB-Verbindung | **pg** (node-postgres) | Direkt, kein ORM-Overhead |
| Auth | **jsonwebtoken** | JWT – gleiche Logik wie Supabase intern |
| Passwörter | **bcrypt** | Sicheres Hashing |
| Umgebungsvariablen | **dotenv** | Gleich wie bisher |

---

## Ordnerstruktur

```
seo-workflow/
├── src/              ← React Frontend (bleibt unverändert)
├── server/           ← NEU: Backend
│   ├── index.js      ← Server-Einstiegspunkt, Port
│   ├── db.js         ← PostgreSQL-Verbindung
│   ├── auth.js       ← Login/Logout/Token-Middleware
│   └── routes/
│       ├── auth.js   ← POST /api/auth/login, /logout
│       ├── projects.js
│       ├── categories.js
│       └── ...       ← je eine Datei pro Tabelle
├── docker/
│   └── dockerfile    ← wird angepasst (Node.js + serve dist/)
└── package.json      ← server-Dependencies hinzufügen
```

---

## Was das Backend macht

**Auth:**
- `POST /api/auth/login` → prüft E-Mail + Passwort, gibt JWT zurück
- `POST /api/auth/logout` → Frontend löscht Token
- Jede andere Route prüft den JWT im Header

**Daten (je Tabelle):**
- `GET /api/projects` → alle Projekte laden
- `POST /api/projects` → neues Projekt anlegen
- `PUT /api/projects/:id` → Projekt updaten
- `DELETE /api/projects/:id` → Projekt löschen

---

## Was am Frontend sich ändert

Aktuell ruft das Frontend Supabase direkt auf:

```js
// vorher
const { data } = await supabase.from('projects').select('*')

// nachher
const data = await fetch('/api/projects').then(r => r.json())
```

Das ist die Hauptarbeit – alle `supabase.from(...)` Aufrufe durch `fetch('/api/...')` ersetzen. Da du wenige Tabellen hast, sind das überschaubar viele Stellen.

---

## Reihenfolge der Umsetzung

```
1. server/ Ordner anlegen + Express aufsetzen       (~1h)
2. DB-Verbindung zu PostgreSQL testen               (~30min)
3. Auth-Routen bauen (login/logout)                 (~1h)
4. Daten-Routen je Tabelle bauen                    (~2-3h)
5. Frontend umstellen: supabase → fetch             (~2-3h)
6. Lokal testen                                     (~1h)
7. Dockerfile anpassen + deployen                   (~30min)
```

**Gesamt: ca. 1 Tag** bei deiner App-Größe.

---

## Dockerfile danach

Da das Backend dann auch `dist/` ausliefert, brauchen wir kein nginx mehr – Node.js macht beides:

```dockerfile
FROM node:22-bookworm-slim AS runtime
# Node.js serviert API + statische Frontend-Dateien
CMD ["node", "server/index.js"]
```

---

## Nächster Schritt

Wenn du bereit bist loszulegen, zeig mir die Supabase-Migrations-Dateien:

```powershell
Get-ChildItem D:\development\cursor_workspace\seo-workflow\supabase\migrations\
```

Dann generiere ich dir den kompletten `server/`-Ordner passend zu deinen Tabellen – du musst nur noch die Frontend-Aufrufe austauschen.
