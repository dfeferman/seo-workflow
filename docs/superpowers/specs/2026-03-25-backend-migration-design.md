# Backend Migration Design

## Ziel

Ablösung von Supabase (API + Auth) durch ein eigenes Express-Backend mit direkter PostgreSQL-Verbindung. Das Frontend kommuniziert nicht mehr direkt mit Supabase, sondern ausschließlich über eine neue `apiClient`-Abstraktionsschicht.

## Kontext

- **App:** React 18 + TypeScript SPA (Vite), TanStack Query, TanStack Router
- **Aktuell:** ~30 Hooks rufen `supabase.from(...)` direkt auf; Auth via `supabase.auth`
- **Ziel-Infrastruktur:** Express-Backend (TypeScript) + PostgreSQL in Docker-Container
- **User-Modell:** Multi-User mit eigener `users`-Tabelle
- **Datenmigration:** Bestehende Supabase-Daten werden importiert; DB-Infrastruktur wird extern aufgesetzt (out of scope)

---

## Architektur

```
React (src/)
  └── hooks/  →  apiClient.*()

src/lib/apiClient.ts         ← zentrales Abstraktionslayer (TypeScript)
  └── fetch('/api/...', { Authorization: Bearer <token> })

server/ (Express + TypeScript)
  ├── index.ts               ← Port, Middleware
  ├── db.ts                  ← pg Pool
  ├── middleware/auth.ts     ← JWT prüfen, req.userId setzen
  └── routes/
      ├── auth.ts
      ├── projects.ts
      ├── categories.ts
      ├── artifacts.ts
      ├── artifactResults.ts
      ├── templates.ts
      ├── phaseOutputTemplates.ts
      ├── categoryPhaseOutputs.ts
      └── categoryReferenceDocs.ts

PostgreSQL (Docker)
  └── Eigene users-Tabelle, kein RLS
```

---

## Schema-Änderungen

### Neue Tabelle `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### FK-Anpassungen

Überall wo bisher `REFERENCES auth.users(id)` stand, wird auf `REFERENCES users(id)` geändert:

- `projects.user_id`
- `templates.user_id`
- `phase_output_templates.user_id`

### RLS entfernt

Alle `ENABLE ROW LEVEL SECURITY` und `CREATE POLICY` Statements werden entfernt. Autorisierung übernimmt das Express-Backend via `req.userId` aus dem JWT.

### Datenmigration

Beim Import aus Supabase müssen User-IDs in `projects`, `templates` und `phase_output_templates` neu gemappt werden, da Supabase-interne `auth.users`-UUIDs nicht übernommen werden können.

---

## Auth-Flow

```
Register: POST /api/auth/register  { email, password }
          → E-Mail-Eindeutigkeit prüfen, bcrypt-Hash, User anlegen, JWT zurückgeben

Login:    POST /api/auth/login  { email, password }
          → bcrypt-Prüfung, JWT (7 Tage) zurückgeben
          → Frontend: Token in localStorage speichern

Anfrage:  Authorization: Bearer <token>
          → middleware/auth.ts: JWT dekodieren, req.userId setzen

Logout:   Frontend löscht Token aus localStorage

App-Start: JWT aus localStorage laden → GET /api/auth/me → User verifizieren
```

---

## apiClient (`src/lib/apiClient.ts`)

Zentrales TypeScript-Modul. Alle Hooks importieren nur noch `apiClient`, nie mehr `supabase`.

### Interner Aufbau

```typescript
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const apiClient = {
  auth: {
    register: (email: string, password: string) => request('POST', '/api/auth/register', { email, password }),
    login:    (email: string, password: string) => request('POST', '/api/auth/login', { email, password }),
    me:       () => request('GET', '/api/auth/me'),
  },
  projects: {
    getAll:  () => request('GET', '/api/projects'),
    getById: (id: string) => request('GET', `/api/projects/${id}`),
    create:  (data: unknown) => request('POST', '/api/projects', data),
    update:  (id: string, data: unknown) => request('PUT', `/api/projects/${id}`, data),
    delete:  (id: string) => request('DELETE', `/api/projects/${id}`),
  },
  categories:            { /* getAll, getById, create, update, delete */ },
  artifacts:             { /* getAll, getById, create, update, delete */ },
  artifactResults:       { /* getAll, create, update, delete */ },
  templates:             { /* getAll, getById, create, update, delete */ },
  phaseOutputTemplates:  { /* getAll, upsert */ },
  categoryPhaseOutputs:  { /* getAll, create */ },
  categoryReferenceDocs: { /* getAll, create, update, delete */ },
}
```

### Hook-Migration (Beispiel)

```typescript
// vorher
const data = await supabase.from('projects').select('*').order('updated_at', { ascending: false })

// nachher
const data = await apiClient.projects.getAll()
```

---

## AuthProvider-Änderungen

| Vorher (Supabase) | Nachher (custom) |
|---|---|
| `supabase.auth.getSession()` | `apiClient.auth.me()` mit Token aus localStorage |
| `supabase.auth.onAuthStateChange()` | entfällt — State nur über Login/Logout |
| `supabase.auth.signOut()` | `localStorage.removeItem('token')` |
| `User` Type von `@supabase/supabase-js` | eigener `User` Type `{ id: string; email: string }` |

---

## Tech-Stack Backend

| Was | Tool |
|---|---|
| Server | Express (TypeScript via tsx) |
| DB-Verbindung | `pg` (node-postgres) mit Connection Pool |
| Auth | `jsonwebtoken` (JWT) |
| Passwörter | `bcrypt` |
| Env-Vars | `dotenv` |
| Dev-Server | `tsx watch` |

---

## Docker & Deployment

### docker-compose.yml

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: seo_workflow
      POSTGRES_USER: seo_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://seo_user:${DB_PASSWORD}@db:5432/seo_workflow
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - db

volumes:
  postgres_data:
```

### Dockerfile

`npm run build` kompiliert sowohl das Vite-Frontend (`dist/`) als auch den Express-Server (`dist/server/`) via `tsc`. Der Runtime-Container führt nur noch kompiliertes JavaScript aus.

```dockerfile
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build        # baut dist/ (Vite) + dist/server/ (tsc)

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
```

Express serviert `/api/*` Routen + statische Dateien aus `dist/` (kein nginx nötig).

### Lokale Entwicklung

- `npm run dev` — Vite Dev Server (Frontend, Port 5173)
- `npm run server:dev` — Express mit `tsx watch` (Port 3001)
- Vite Proxy: `/api/*` → `http://localhost:3001`

---

## Migrations-Reihenfolge

1. `server/` aufsetzen (Express, db.ts, auth-Middleware)
2. `POST /api/auth/login` + `GET /api/auth/me` implementieren
3. `src/lib/apiClient.ts` erstellen
4. `AuthProvider` auf apiClient umstellen
5. Alle Routen je Tabelle implementieren
6. Alle Hooks von `supabase.from()` auf `apiClient.*` umstellen
7. Supabase-Dependency aus Frontend entfernen
8. Dockerfile + docker-compose.yml anpassen
9. Lokal testen (docker compose up)
