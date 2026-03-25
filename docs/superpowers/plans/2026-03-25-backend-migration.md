# Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase durch ein eigenes Express-Backend mit PostgreSQL ersetzen, über eine zentrale `apiClient`-Abstraktionsschicht im Frontend.

**Architecture:** Express (TypeScript) im `server/`-Ordner bedient alle `/api/*`-Routen und serviert das Vite-Frontend aus `dist/`. Alle ~30 Frontend-Hooks rufen nicht mehr `supabase.from()` auf, sondern `apiClient.*()` — eine neue Abstraktionsschicht in `src/lib/apiClient.ts`. Auth läuft über JWT (jsonwebtoken + bcrypt) statt Supabase Auth.

**Tech Stack:** Express, pg (node-postgres), jsonwebtoken, bcrypt, tsx (dev), vitest + supertest (tests)

**Spec:** `docs/superpowers/specs/2026-03-25-backend-migration-design.md`

---

## Dateistruktur

**Neu erstellen:**
```
server/
  tsconfig.json          ← eigene TS-Config für Node.js/CommonJS
  index.ts               ← Express-App + static serving, separater export für Tests
  db.ts                  ← pg Pool, DATABASE_URL aus env
  middleware/
    auth.ts              ← JWT verify, req.userId setzen
  routes/
    auth.ts              ← POST /register, /login; GET /me
    projects.ts          ← GET /, POST /, PUT /:id, DELETE /:id
    categories.ts        ← GET /by-project/:projectId, POST /, PUT /:id, DELETE /:id
    artifacts.ts         ← GET /by-category/:categoryId, POST /, PUT /:id, DELETE /:id
    artifactResults.ts   ← GET /by-artifact/:artifactId, POST / (mit auto-versioning), PUT /:id
    templates.ts         ← GET /, POST /, PUT /:id, DELETE /:id
    phaseOutputTemplates.ts ← GET /, PUT /:phase (upsert)
    categoryPhaseOutputs.ts ← GET /by-category/:categoryId, POST /
    categoryReferenceDocs.ts ← GET /by-category/:categoryId, POST /, PUT /:id, DELETE /:id
  tests/
    auth.test.ts         ← Integrationstests für auth-Routen
server/db/
  schema.sql             ← komplettes Schema für neue PostgreSQL (ohne RLS, mit users-Tabelle)
src/lib/
  apiClient.ts           ← neues zentrales Abstraktionslayer
docker-compose.yml
```

**Modifizieren:**
```
package.json             ← server-Deps hinzufügen, neue Scripts
tsconfig.json            ← server/ ausschließen
vite.config.ts           ← /api/* Proxy für Dev + server/ zu coverage hinzufügen
src/components/AuthProvider.tsx  ← supabase.auth → apiClient.auth
src/hooks/useProjects.ts        ← supabase → apiClient
src/hooks/useProject.ts
src/hooks/useCategories.ts
src/hooks/useCategory.ts
src/hooks/useSubcategories.ts
src/hooks/useCreateCategory.ts
src/hooks/useUpdateCategory.ts
src/hooks/useDeleteCategory.ts
src/hooks/useCategoryProgress.ts
src/hooks/useArtifacts.ts
src/hooks/useArtifactResults.ts
src/hooks/useDeleteArtifact.ts
src/hooks/useUpdateArtifact.ts
src/hooks/usePhaseArtifactResultsMap.ts
src/hooks/useStats.ts
src/hooks/useTemplates.ts
src/hooks/useSaveTemplate.ts
src/hooks/useUpdateTemplate.ts
src/hooks/useDeleteTemplate.ts
src/hooks/useSyncTemplateToArtifacts.ts
src/hooks/usePhaseOutputTemplates.ts
src/hooks/useSavePhaseOutputTemplate.ts
src/hooks/useCategoryPhaseOutput.ts
src/hooks/useSaveCategoryPhaseOutput.ts
src/hooks/useDeleteCategoryPhaseOutput.ts
src/hooks/useCategoryReferenceDocs.ts
src/hooks/usePlaceholderData.ts
Dockerfile
```

---

## Task 1: Projekt-Setup — Dependencies + Scripts

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `server/tsconfig.json`

- [ ] **Step 1: Server-Dependencies installieren**

```bash
npm install express pg jsonwebtoken bcrypt dotenv cors
npm install --save-dev @types/express @types/pg @types/jsonwebtoken @types/bcrypt @types/cors tsx supertest @types/supertest
```

- [ ] **Step 2: Verify Installation**

```bash
npm list express pg jsonwebtoken bcrypt
```
Expected: Keine Fehler, Versionen angezeigt.

- [ ] **Step 3: Scripts in `package.json` ergänzen**

Im `"scripts"`-Block hinzufügen:
```json
"server:dev": "tsx watch server/index.ts",
"server:build": "tsc --project server/tsconfig.json",
"build": "tsc -b && vite build && npm run server:build"
```

- [ ] **Step 4: `server/tsconfig.json` erstellen**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "../dist/server",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
```

- [ ] **Step 5: Root `tsconfig.json` — `server/` vom Frontend-Build ausschließen**

In `tsconfig.json` (oder `tsconfig.app.json` falls vorhanden) unter `"exclude"` hinzufügen:
```json
"exclude": ["node_modules", "server"]
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json server/tsconfig.json
git commit -m "chore: server-Dependencies und tsconfig hinzugefügt"
```

---

## Task 2: Datenbankschema für neue PostgreSQL

**Files:**
- Create: `server/db/schema.sql`

Dieses Schema wird in die neue Docker-PostgreSQL importiert. Es enthält eine eigene `users`-Tabelle statt `auth.users`, und kein RLS.

- [ ] **Step 1: `server/db/schema.sql` erstellen**

```sql
-- Enums
CREATE TYPE content_type AS ENUM ('category', 'blog');
CREATE TYPE result_status AS ENUM ('draft', 'final');

-- 1. users (ersetzt auth.users)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. projects
CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- 3. categories
CREATE TABLE categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id           UUID REFERENCES categories(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  type                content_type NOT NULL DEFAULT 'category',
  hub_name            VARCHAR(255),
  zielgruppen         TEXT[],
  shop_typ            VARCHAR(100),
  usps                TEXT,
  ton                 TEXT,
  no_gos              TEXT,
  display_order       INT DEFAULT 0,
  custom_placeholders JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_project_id ON categories(project_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- 4. artifacts
CREATE TABLE artifacts (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id                UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  phase                      CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')),
  artifact_code              VARCHAR(10) NOT NULL,
  name                       VARCHAR(255) NOT NULL,
  description                TEXT,
  prompt_template            TEXT NOT NULL,
  recommended_source         VARCHAR(50),
  estimated_duration_minutes INT,
  display_order              INT DEFAULT 0,
  template_id                UUID,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, artifact_code)
);
CREATE INDEX idx_artifacts_category_id ON artifacts(category_id);
CREATE INDEX idx_artifacts_phase ON artifacts(phase);

-- 5. artifact_results
CREATE TABLE artifact_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  result_text TEXT,
  source      VARCHAR(50),
  version     INT DEFAULT 1,
  status      result_status DEFAULT 'draft',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_artifact_results_artifact_id ON artifact_results(artifact_id);
CREATE INDEX idx_artifact_results_version ON artifact_results(artifact_id, version DESC);

-- 6. artifact_dependencies
CREATE TABLE artifact_dependencies (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id             UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  depends_on_artifact_id  UUID REFERENCES artifacts(id) ON DELETE CASCADE,
  depends_on_phase        CHAR(1),
  placeholder_name        VARCHAR(50) NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (depends_on_artifact_id IS NOT NULL AND depends_on_phase IS NULL) OR
    (depends_on_artifact_id IS NULL AND depends_on_phase IS NOT NULL)
  )
);
CREATE INDEX idx_artifact_dependencies_artifact_id ON artifact_dependencies(artifact_id);

-- 7. templates
CREATE TABLE templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  phase           CHAR(1) NOT NULL,
  artifact_code   VARCHAR(10),
  prompt_template TEXT NOT NULL,
  tags            TEXT[],
  usage_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_phase ON templates(phase);

-- 8. phase_output_templates
CREATE TABLE phase_output_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase         CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')),
  template_text TEXT NOT NULL DEFAULT '',
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phase)
);
CREATE INDEX idx_phase_output_templates_user_id ON phase_output_templates(user_id);

-- 9. category_phase_outputs
CREATE TABLE category_phase_outputs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  phase       CHAR(1) NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G','X')),
  output_text TEXT,
  version     INT NOT NULL DEFAULT 1,
  status      result_status NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_category_phase_outputs_category_id ON category_phase_outputs(category_id);
CREATE INDEX idx_category_phase_outputs_lookup ON category_phase_outputs(category_id, phase, version DESC);

-- 10. category_reference_docs
CREATE TABLE category_reference_docs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  display_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_category_reference_docs_category_id ON category_reference_docs(category_id);
```

- [ ] **Step 2: Commit**

```bash
git add server/db/schema.sql
git commit -m "feat: PostgreSQL-Schema ohne RLS und mit eigener users-Tabelle"
```

---

## Task 3: DB-Verbindung (`server/db.ts`)

**Files:**
- Create: `server/db.ts`
- Create: `.env.local` (nicht committen)

- [ ] **Step 1: `.env.local` anlegen** (falls noch nicht vorhanden)

```
DATABASE_URL=postgresql://seo_user:password@localhost:5432/seo_workflow
JWT_SECRET=dev-secret-change-in-production
PORT=3001
```

Sicherstellen, dass `.env.local` in `.gitignore` steht:
```bash
grep ".env.local" .gitignore || echo ".env.local" >> .gitignore
```

- [ ] **Step 2: `server/db.ts` erstellen**

```typescript
import { Pool } from 'pg'
import 'dotenv/config'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err)
})
```

- [ ] **Step 3: Verbindung testen**

```bash
npx tsx -e "
import { pool } from './server/db.ts'
pool.query('SELECT NOW()').then(r => { console.log('DB OK:', r.rows[0]); pool.end() }).catch(e => { console.error('DB ERROR:', e.message); process.exit(1) })
"
```
Expected: `DB OK: { now: <timestamp> }`

- [ ] **Step 4: Commit**

```bash
git add server/db.ts .gitignore
git commit -m "feat: PostgreSQL-Verbindungsmodul"
```

---

## Task 4: Auth-Middleware (`server/middleware/auth.ts`)

**Files:**
- Create: `server/middleware/auth.ts`

- [ ] **Step 1: `server/middleware/auth.ts` erstellen**

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET not configured' })
    return
  }

  try {
    const payload = jwt.verify(token, secret) as { userId: string }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/middleware/auth.ts
git commit -m "feat: JWT-Auth-Middleware"
```

---

## Task 5: Auth-Routen + Tests (`server/routes/auth.ts`)

**Files:**
- Create: `server/routes/auth.ts`
- Create: `server/tests/auth.test.ts`

- [ ] **Step 1: Failing test schreiben**

Erstelle `server/tests/auth.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import { pool } from '../db'

beforeAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'test@example.com'`)
})

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = 'test@example.com'`)
  await pool.end()
})

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('test@example.com')
  })

  it('returns 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('returns token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns user for valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
    const token = loginRes.body.token

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('test@example.com')
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Test läuft mit Fehler**

Dafür muss zuerst ein minimaler `server/index.ts` existieren (nur damit der Import nicht crasht):

Erstelle `server/index.ts` (Stub):
```typescript
import express from 'express'
import 'dotenv/config'

export const app = express()
app.use(express.json())

const PORT = process.env.PORT ?? 3001
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
```

```bash
npx vitest run server/tests/auth.test.ts
```
Expected: FAIL — Routes not found (404)

- [ ] **Step 3: `server/routes/auth.ts` implementieren**

```typescript
import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET!
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  try {
    const password_hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, password_hash]
    )
    const user = result.rows[0]
    res.status(201).json({ user, token: signToken(user.id) })
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already registered' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  const result = await pool.query(
    `SELECT id, email, password_hash FROM users WHERE email = $1`,
    [email]
  )
  const user = result.rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const { password_hash: _, ...safeUser } = user
  res.json({ user: safeUser, token: signToken(user.id) })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT id, email, created_at FROM users WHERE id = $1`,
    [req.userId]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json(result.rows[0])
})

export default router
```

- [ ] **Step 4: Route in `server/index.ts` registrieren**

```typescript
import express from 'express'
import 'dotenv/config'
import authRouter from './routes/auth'

export const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)

const PORT = process.env.PORT ?? 3001
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
```

- [ ] **Step 5: Test läuft durch**

```bash
npx vitest run server/tests/auth.test.ts
```
Expected: PASS — alle 6 Tests grün

- [ ] **Step 6: Commit**

```bash
git add server/routes/auth.ts server/tests/auth.test.ts server/index.ts
git commit -m "feat: Auth-Routen (register, login, me) mit Tests"
```

---

## Task 6: Daten-Routen — Projects + Categories

**Files:**
- Create: `server/routes/projects.ts`
- Create: `server/routes/categories.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: `server/routes/projects.ts` erstellen**

```typescript
import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()
router.use(requireAuth)

// GET /api/projects
router.get('/', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC`,
    [req.userId]
  )
  res.json(result.rows)
})

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM projects WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId]
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.json(result.rows[0])
})

// POST /api/projects
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name } = req.body
  if (!name) { res.status(400).json({ error: 'name required' }); return }
  const result = await pool.query(
    `INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING *`,
    [req.userId, name]
  )
  res.status(201).json(result.rows[0])
})

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { name } = req.body
  const result = await pool.query(
    `UPDATE projects SET name = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [name, req.params.id, req.userId]
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.json(result.rows[0])
})

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, req.userId]
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.status(204).send()
})

export default router
```

- [ ] **Step 2: `server/routes/categories.ts` erstellen**

Kategorien werden über `project_id` autorisiert (JOIN auf projects.user_id). Alle Queries prüfen, ob das zugehörige Projekt dem anfragenden User gehört.

```typescript
import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()
router.use(requireAuth)

// Hilfsfunktion: prüft ob Kategorie dem User gehört
async function categoryBelongsToUser(categoryId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM categories c JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1 AND p.user_id = $2`,
    [categoryId, userId]
  )
  return r.rowCount > 0
}

// GET /api/categories/by-project/:projectId
router.get('/by-project/:projectId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT c.* FROM categories c
     JOIN projects p ON p.id = c.project_id
     WHERE c.project_id = $1 AND p.user_id = $2
     ORDER BY c.display_order ASC`,
    [req.params.projectId, req.userId]
  )
  res.json(result.rows)
})

// GET /api/categories/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await categoryBelongsToUser(req.params.id, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  const result = await pool.query(`SELECT * FROM categories WHERE id = $1`, [req.params.id])
  res.json(result.rows[0])
})

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response) => {
  const { project_id, parent_id, name, type, hub_name, zielgruppen,
          shop_typ, usps, ton, no_gos, display_order, custom_placeholders } = req.body
  // Projekt-Zugehörigkeit prüfen
  const pCheck = await pool.query(
    `SELECT 1 FROM projects WHERE id = $1 AND user_id = $2`,
    [project_id, req.userId]
  )
  if (!pCheck.rowCount) { res.status(403).json({ error: 'Forbidden' }); return }

  const result = await pool.query(
    `INSERT INTO categories
       (project_id, parent_id, name, type, hub_name, zielgruppen, shop_typ, usps, ton, no_gos, display_order, custom_placeholders)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [project_id, parent_id ?? null, name, type ?? 'category', hub_name ?? null,
     zielgruppen ?? null, shop_typ ?? null, usps ?? null, ton ?? null, no_gos ?? null,
     display_order ?? 0, custom_placeholders ?? {}]
  )
  res.status(201).json(result.rows[0])
})

// PUT /api/categories/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await categoryBelongsToUser(req.params.id, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  const fields = ['name','hub_name','zielgruppen','shop_typ','usps','ton','no_gos',
                  'display_order','custom_placeholders','parent_id','type']
  const updates: string[] = []
  const values: unknown[] = []
  let idx = 1
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`)
      values.push(req.body[f])
    }
  }
  updates.push(`updated_at = NOW()`)
  values.push(req.params.id)
  const result = await pool.query(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  res.json(result.rows[0])
})

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await categoryBelongsToUser(req.params.id, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  await pool.query(`DELETE FROM categories WHERE id = $1`, [req.params.id])
  res.status(204).send()
})

export default router
```

- [ ] **Step 3: Routen in `server/index.ts` registrieren**

```typescript
import projectsRouter from './routes/projects'
import categoriesRouter from './routes/categories'
// ...
app.use('/api/projects', projectsRouter)
app.use('/api/categories', categoriesRouter)
```

- [ ] **Step 4: Manuell testen (Server starten)**

```bash
npm run server:dev
# In neuem Terminal:
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@test.com","password":"test123"}' | jq .
```
Expected: `{ "user": {...}, "token": "eyJ..." }`

```bash
TOKEN="<token-from-above>"
curl -s http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" | jq .
```
Expected: `[]`

- [ ] **Step 5: Commit**

```bash
git add server/routes/projects.ts server/routes/categories.ts server/index.ts
git commit -m "feat: Projects- und Categories-Routen"
```

---

## Task 7: Daten-Routen — Artifacts + ArtifactResults

**Files:**
- Create: `server/routes/artifacts.ts`
- Create: `server/routes/artifactResults.ts`
- Modify: `server/index.ts`

Das Autorisierungsmuster ist identisch zu categories (JOIN über project → user_id).

Die `artifactResults`-Route übernimmt die Auto-Versioning-Logik aus dem bisherigen Frontend-Hook.

- [ ] **Step 1: `server/routes/artifacts.ts` erstellen**

```typescript
import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()
router.use(requireAuth)

async function artifactBelongsToUser(artifactId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM artifacts a
     JOIN categories c ON c.id = a.category_id
     JOIN projects p ON p.id = c.project_id
     WHERE a.id = $1 AND p.user_id = $2`,
    [artifactId, userId]
  )
  return r.rowCount > 0
}

// GET /api/artifacts/by-category/:categoryId
router.get('/by-category/:categoryId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT a.* FROM artifacts a
     JOIN categories c ON c.id = a.category_id
     JOIN projects p ON p.id = c.project_id
     WHERE a.category_id = $1 AND p.user_id = $2
     ORDER BY a.display_order ASC`,
    [req.params.categoryId, req.userId]
  )
  res.json(result.rows)
})

// GET /api/artifacts/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await artifactBelongsToUser(req.params.id, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  const result = await pool.query(`SELECT * FROM artifacts WHERE id = $1`, [req.params.id])
  res.json(result.rows[0])
})

// POST /api/artifacts
router.post('/', async (req: AuthRequest, res: Response) => {
  const { category_id, phase, artifact_code, name, description, prompt_template,
          recommended_source, estimated_duration_minutes, display_order, template_id } = req.body
  // category-Zugehörigkeit prüfen
  const check = await pool.query(
    `SELECT 1 FROM categories c JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1 AND p.user_id = $2`,
    [category_id, req.userId]
  )
  if (!check.rowCount) { res.status(403).json({ error: 'Forbidden' }); return }

  const result = await pool.query(
    `INSERT INTO artifacts
       (category_id, phase, artifact_code, name, description, prompt_template,
        recommended_source, estimated_duration_minutes, display_order, template_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [category_id, phase, artifact_code, name, description ?? null, prompt_template,
     recommended_source ?? null, estimated_duration_minutes ?? null,
     display_order ?? 0, template_id ?? null]
  )
  res.status(201).json(result.rows[0])
})

// PUT /api/artifacts/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await artifactBelongsToUser(req.params.id, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  const fields = ['name','description','prompt_template','phase','artifact_code',
                  'recommended_source','estimated_duration_minutes','display_order','template_id']
  const updates: string[] = []
  const values: unknown[] = []
  let idx = 1
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`)
      values.push(req.body[f])
    }
  }
  updates.push(`updated_at = NOW()`)
  values.push(req.params.id)
  const result = await pool.query(
    `UPDATE artifacts SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  res.json(result.rows[0])
})

// DELETE /api/artifacts/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await artifactBelongsToUser(req.params.id, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  await pool.query(`DELETE FROM artifacts WHERE id = $1`, [req.params.id])
  res.status(204).send()
})

export default router
```

- [ ] **Step 2: `server/routes/artifactResults.ts` erstellen**

**Wichtig:** Die Auto-Versioning-Logik aus `useArtifactResults.ts` zieht hier rein (Server berechnet `nextVersion`).

```typescript
import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()
router.use(requireAuth)

async function resultBelongsToUser(resultId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM artifact_results ar
     JOIN artifacts a ON a.id = ar.artifact_id
     JOIN categories c ON c.id = a.category_id
     JOIN projects p ON p.id = c.project_id
     WHERE ar.id = $1 AND p.user_id = $2`,
    [resultId, userId]
  )
  return r.rowCount > 0
}

// GET /api/artifact-results/by-artifact/:artifactId
router.get('/by-artifact/:artifactId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT ar.* FROM artifact_results ar
     JOIN artifacts a ON a.id = ar.artifact_id
     JOIN categories c ON c.id = a.category_id
     JOIN projects p ON p.id = c.project_id
     WHERE ar.artifact_id = $1 AND p.user_id = $2
     ORDER BY ar.version DESC`,
    [req.params.artifactId, req.userId]
  )
  res.json(result.rows)
})

// POST /api/artifact-results  (auto-versioning)
router.post('/', async (req: AuthRequest, res: Response) => {
  const { artifact_id, result_text, source = 'manual' } = req.body
  // Zugehörigkeit prüfen
  const check = await pool.query(
    `SELECT 1 FROM artifacts a
     JOIN categories c ON c.id = a.category_id
     JOIN projects p ON p.id = c.project_id
     WHERE a.id = $1 AND p.user_id = $2`,
    [artifact_id, req.userId]
  )
  if (!check.rowCount) { res.status(403).json({ error: 'Forbidden' }); return }

  // Nächste Version berechnen
  const versionRes = await pool.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
     FROM artifact_results WHERE artifact_id = $1`,
    [artifact_id]
  )
  const nextVersion = versionRes.rows[0].next_version

  const result = await pool.query(
    `INSERT INTO artifact_results (artifact_id, result_text, source, version, status)
     VALUES ($1, $2, $3, $4, 'draft') RETURNING *`,
    [artifact_id, result_text, source, nextVersion]
  )
  res.status(201).json(result.rows[0])
})

// PUT /api/artifact-results/:id  (z.B. status auf 'final' setzen)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  if (!(await resultBelongsToUser(req.params.id, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  const { status, result_text } = req.body
  const updates: string[] = []
  const values: unknown[] = []
  let idx = 1
  if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status) }
  if (result_text !== undefined) { updates.push(`result_text = $${idx++}`); values.push(result_text) }
  updates.push(`updated_at = NOW()`)
  values.push(req.params.id)
  const result = await pool.query(
    `UPDATE artifact_results SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  res.json(result.rows[0])
})

export default router
```

- [ ] **Step 3: Routen in `server/index.ts` eintragen**

```typescript
import artifactsRouter from './routes/artifacts'
import artifactResultsRouter from './routes/artifactResults'
app.use('/api/artifacts', artifactsRouter)
app.use('/api/artifact-results', artifactResultsRouter)
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/artifacts.ts server/routes/artifactResults.ts server/index.ts
git commit -m "feat: Artifacts- und ArtifactResults-Routen"
```

---

## Task 8: Daten-Routen — Templates + PhaseOutputTemplates + CategoryPhaseOutputs + CategoryReferenceDocs

**Files:**
- Create: `server/routes/templates.ts`
- Create: `server/routes/phaseOutputTemplates.ts`
- Create: `server/routes/categoryPhaseOutputs.ts`
- Create: `server/routes/categoryReferenceDocs.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: `server/routes/templates.ts` erstellen**

```typescript
import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM templates WHERE user_id = $1 ORDER BY updated_at DESC`,
    [req.userId]
  )
  res.json(result.rows)
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM templates WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId]
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.json(result.rows[0])
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description, phase, artifact_code, prompt_template, tags } = req.body
  const result = await pool.query(
    `INSERT INTO templates (user_id, name, description, phase, artifact_code, prompt_template, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.userId, name, description ?? null, phase, artifact_code ?? null,
     prompt_template, tags ?? null]
  )
  res.status(201).json(result.rows[0])
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const fields = ['name','description','phase','artifact_code','prompt_template','tags','usage_count']
  const updates: string[] = []
  const values: unknown[] = []
  let idx = 1
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = $${idx++}`); values.push(req.body[f]) }
  }
  updates.push(`updated_at = NOW()`)
  values.push(req.params.id, req.userId)
  const result = await pool.query(
    `UPDATE templates SET ${updates.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    values
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.json(result.rows[0])
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, req.userId]
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.status(204).send()
})

export default router
```

- [ ] **Step 2: `server/routes/phaseOutputTemplates.ts` erstellen**

```typescript
import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM phase_output_templates WHERE user_id = $1 ORDER BY phase`,
    [req.userId]
  )
  res.json(result.rows)
})

// PUT /api/phase-output-templates/:phase  (upsert)
router.put('/:phase', async (req: AuthRequest, res: Response) => {
  const { template_text, description } = req.body
  const result = await pool.query(
    `INSERT INTO phase_output_templates (user_id, phase, template_text, description)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, phase)
     DO UPDATE SET template_text = EXCLUDED.template_text,
                   description = EXCLUDED.description,
                   updated_at = NOW()
     RETURNING *`,
    [req.userId, req.params.phase, template_text ?? '', description ?? null]
  )
  res.json(result.rows[0])
})

export default router
```

- [ ] **Step 3: `server/routes/categoryPhaseOutputs.ts` erstellen**

```typescript
import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()
router.use(requireAuth)

async function categoryBelongsToUser(categoryId: string, userId: string) {
  const r = await pool.query(
    `SELECT 1 FROM categories c JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1 AND p.user_id = $2`, [categoryId, userId]
  )
  return r.rowCount > 0
}

router.get('/by-category/:categoryId', async (req: AuthRequest, res: Response) => {
  if (!(await categoryBelongsToUser(req.params.categoryId, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  const result = await pool.query(
    `SELECT * FROM category_phase_outputs
     WHERE category_id = $1 ORDER BY phase, version DESC`,
    [req.params.categoryId]
  )
  res.json(result.rows)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { category_id, phase, output_text, status } = req.body
  if (!(await categoryBelongsToUser(category_id, req.userId!))) {
    res.status(403).json({ error: 'Forbidden' }); return
  }
  const vRes = await pool.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next FROM category_phase_outputs
     WHERE category_id = $1 AND phase = $2`,
    [category_id, phase]
  )
  const result = await pool.query(
    `INSERT INTO category_phase_outputs (category_id, phase, output_text, version, status)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [category_id, phase, output_text ?? null, vRes.rows[0].next, status ?? 'draft']
  )
  res.status(201).json(result.rows[0])
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  // Autorisierung über JOIN
  const result = await pool.query(
    `DELETE FROM category_phase_outputs cpo
     USING categories c, projects p
     WHERE cpo.id = $1
       AND cpo.category_id = c.id
       AND c.project_id = p.id
       AND p.user_id = $2
     RETURNING cpo.id`,
    [req.params.id, req.userId]
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.status(204).send()
})

export default router
```

- [ ] **Step 4: `server/routes/categoryReferenceDocs.ts` erstellen**

```typescript
import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { Response } from 'express'

const router = Router()
router.use(requireAuth)

async function categoryBelongsToUser(categoryId: string, userId: string) {
  const r = await pool.query(
    `SELECT 1 FROM categories c JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1 AND p.user_id = $2`, [categoryId, userId]
  )
  return r.rowCount > 0
}

router.get('/by-category/:categoryId', async (req: AuthRequest, res: Response) => {
  if (!(await categoryBelongsToUser(req.params.categoryId, req.userId!))) {
    res.status(404).json({ error: 'Not found' }); return
  }
  const result = await pool.query(
    `SELECT * FROM category_reference_docs WHERE category_id = $1 ORDER BY display_order`,
    [req.params.categoryId]
  )
  res.json(result.rows)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { category_id, title, content, display_order } = req.body
  if (!(await categoryBelongsToUser(category_id, req.userId!))) {
    res.status(403).json({ error: 'Forbidden' }); return
  }
  const result = await pool.query(
    `INSERT INTO category_reference_docs (category_id, title, content, display_order)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [category_id, title, content ?? '', display_order ?? 0]
  )
  res.status(201).json(result.rows[0])
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { title, content, display_order } = req.body
  const result = await pool.query(
    `UPDATE category_reference_docs SET
       title = COALESCE($1, title),
       content = COALESCE($2, content),
       display_order = COALESCE($3, display_order),
       updated_at = NOW()
     WHERE id = $4
       AND category_id IN (
         SELECT c.id FROM categories c JOIN projects p ON p.id = c.project_id
         WHERE p.user_id = $5
       )
     RETURNING *`,
    [title, content, display_order, req.params.id, req.userId]
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.json(result.rows[0])
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `DELETE FROM category_reference_docs
     WHERE id = $1
       AND category_id IN (
         SELECT c.id FROM categories c JOIN projects p ON p.id = c.project_id WHERE p.user_id = $2
       )
     RETURNING id`,
    [req.params.id, req.userId]
  )
  if (!result.rows[0]) { res.status(404).json({ error: 'Not found' }); return }
  res.status(204).send()
})

export default router
```

- [ ] **Step 5: Alle Routen in `server/index.ts` registrieren**

```typescript
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import 'dotenv/config'
import authRouter from './routes/auth'
import projectsRouter from './routes/projects'
import categoriesRouter from './routes/categories'
import artifactsRouter from './routes/artifacts'
import artifactResultsRouter from './routes/artifactResults'
import templatesRouter from './routes/templates'
import phaseOutputTemplatesRouter from './routes/phaseOutputTemplates'
import categoryPhaseOutputsRouter from './routes/categoryPhaseOutputs'
import categoryReferenceDocsRouter from './routes/categoryReferenceDocs'

export const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/artifacts', artifactsRouter)
app.use('/api/artifact-results', artifactResultsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/phase-output-templates', phaseOutputTemplatesRouter)
app.use('/api/category-phase-outputs', categoryPhaseOutputsRouter)
app.use('/api/category-reference-docs', categoryReferenceDocsRouter)

// Statische Dateien (Prod): Frontend aus dist/ servieren
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  app.use(express.static(path.join(__dirname, '../')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
  })
}

const PORT = process.env.PORT ?? 3001
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
```

- [ ] **Step 6: Auth-Test nochmals laufen lassen**

```bash
npx vitest run server/tests/auth.test.ts
```
Expected: PASS (alle 6 Tests)

- [ ] **Step 7: Commit**

```bash
git add server/routes/ server/index.ts
git commit -m "feat: alle Daten-Routen (templates, phase-outputs, reference-docs)"
```

---

## Task 9: apiClient (`src/lib/apiClient.ts`)

**Files:**
- Create: `src/lib/apiClient.ts`

- [ ] **Step 1: `src/lib/apiClient.ts` erstellen**

```typescript
// Zentrales API-Abstraktionslayer. Alle Hooks importieren nur noch apiClient.
// Niemals supabase direkt in Hooks verwenden.

const BASE_URL = ''  // Vite Proxy leitet /api/* weiter; in Prod: gleicher Origin

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('auth_token')
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const apiClient = {
  auth: {
    register: (email: string, password: string) =>
      request<{ user: any; token: string }>('POST', '/api/auth/register', { email, password }),
    login: (email: string, password: string) =>
      request<{ user: any; token: string }>('POST', '/api/auth/login', { email, password }),
    me: () => request<any>('GET', '/api/auth/me'),
  },

  projects: {
    getAll:  () => request<any[]>('GET', '/api/projects'),
    getById: (id: string) => request<any>('GET', `/api/projects/${id}`),
    create:  (data: { name: string }) => request<any>('POST', '/api/projects', data),
    update:  (id: string, data: Partial<{ name: string }>) =>
      request<any>('PUT', `/api/projects/${id}`, data),
    delete:  (id: string) => request<void>('DELETE', `/api/projects/${id}`),
  },

  categories: {
    getByProject: (projectId: string) =>
      request<any[]>('GET', `/api/categories/by-project/${projectId}`),
    getById: (id: string) => request<any>('GET', `/api/categories/${id}`),
    create:  (data: any) => request<any>('POST', '/api/categories', data),
    update:  (id: string, data: any) => request<any>('PUT', `/api/categories/${id}`, data),
    delete:  (id: string) => request<void>('DELETE', `/api/categories/${id}`),
  },

  artifacts: {
    getByCategory: (categoryId: string) =>
      request<any[]>('GET', `/api/artifacts/by-category/${categoryId}`),
    getById: (id: string) => request<any>('GET', `/api/artifacts/${id}`),
    create:  (data: any) => request<any>('POST', '/api/artifacts', data),
    update:  (id: string, data: any) => request<any>('PUT', `/api/artifacts/${id}`, data),
    delete:  (id: string) => request<void>('DELETE', `/api/artifacts/${id}`),
  },

  artifactResults: {
    getByArtifact: (artifactId: string) =>
      request<any[]>('GET', `/api/artifact-results/by-artifact/${artifactId}`),
    create: (data: { artifact_id: string; result_text: string; source?: string }) =>
      request<any>('POST', '/api/artifact-results', data),
    update: (id: string, data: { status?: string; result_text?: string }) =>
      request<any>('PUT', `/api/artifact-results/${id}`, data),
  },

  templates: {
    getAll:  () => request<any[]>('GET', '/api/templates'),
    getById: (id: string) => request<any>('GET', `/api/templates/${id}`),
    create:  (data: any) => request<any>('POST', '/api/templates', data),
    update:  (id: string, data: any) => request<any>('PUT', `/api/templates/${id}`, data),
    delete:  (id: string) => request<void>('DELETE', `/api/templates/${id}`),
  },

  phaseOutputTemplates: {
    getAll:  () => request<any[]>('GET', '/api/phase-output-templates'),
    upsert:  (phase: string, data: { template_text: string; description?: string }) =>
      request<any>('PUT', `/api/phase-output-templates/${phase}`, data),
  },

  categoryPhaseOutputs: {
    getByCategory: (categoryId: string) =>
      request<any[]>('GET', `/api/category-phase-outputs/by-category/${categoryId}`),
    create: (data: any) => request<any>('POST', '/api/category-phase-outputs', data),
    delete: (id: string) => request<void>('DELETE', `/api/category-phase-outputs/${id}`),
  },

  categoryReferenceDocs: {
    getByCategory: (categoryId: string) =>
      request<any[]>('GET', `/api/category-reference-docs/by-category/${categoryId}`),
    create: (data: any) => request<any>('POST', '/api/category-reference-docs', data),
    update: (id: string, data: any) =>
      request<any>('PUT', `/api/category-reference-docs/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/category-reference-docs/${id}`),
  },
}
```

- [ ] **Step 2: Vite Dev-Proxy konfigurieren** (`vite.config.ts`)

Im `defineConfig`-Objekt ergänzen:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
},
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/apiClient.ts vite.config.ts
git commit -m "feat: apiClient-Abstraktionslayer + Vite Proxy"
```

---

## Task 10: AuthProvider migrieren

**Files:**
- Modify: `src/components/AuthProvider.tsx`

- [ ] **Step 1: `AuthProvider.tsx` auf apiClient umstellen**

Ersetze den gesamten Inhalt:
```typescript
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiClient, setToken, clearToken } from '@/lib/apiClient'

type AppUser = { id: string; email: string }

type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  signOut: () => void
  signIn: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    apiClient.auth.me()
      .then((u) => setUser(u))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiClient.auth.login(email, password)
    setToken(token)
    setUser(u)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiClient.auth.register(email, password)
    setToken(token)
    setUser(u)
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signIn, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Login-Seite überprüfen**

Suche nach der Login-Komponente und stelle sicher, dass `signIn` und `register` aus `useAuth()` korrekt aufgerufen werden (statt `supabase.auth.signInWithPassword`).

```bash
grep -r "signInWithPassword\|supabase.auth" src/
```
Expected: Keine Treffer mehr in Komponenten (außer ggf. alter Loginseite — dort ebenfalls umstellen).

- [ ] **Step 3: Frontend starten und Login testen**

```bash
npm run dev &
npm run server:dev
```
Öffne http://localhost:5173 → Login mit dem zuvor registrierten Account testen.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthProvider.tsx
git commit -m "feat: AuthProvider auf eigenes Backend umgestellt"
```

---

## Task 11: Hooks migrieren — Projects + Categories

**Files:**
- Modify: `src/hooks/useProjects.ts`
- Modify: `src/hooks/useProject.ts`
- Modify: `src/hooks/useCategories.ts`
- Modify: `src/hooks/useCategory.ts`
- Modify: `src/hooks/useSubcategories.ts`
- Modify: `src/hooks/useCreateCategory.ts`
- Modify: `src/hooks/useUpdateCategory.ts`
- Modify: `src/hooks/useDeleteCategory.ts`
- Modify: `src/hooks/useCategoryProgress.ts`

Das Muster ist überall gleich: `supabase.from('X').select(...)` → `apiClient.X.getY(...)`.

- [ ] **Step 1: `useProjects.ts` umstellen**

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ProjectRow } from '@/types/database.types'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: (): Promise<ProjectRow[]> => apiClient.projects.getAll(),
  })
}
```

- [ ] **Step 2: `useProject.ts` umstellen**

Lese die Datei zuerst, dann `supabase.from('projects').select('*').eq('id', projectId)` ersetzen durch:
```typescript
queryFn: () => apiClient.projects.getById(projectId!)
```

- [ ] **Step 3: `useCategories.ts` und `useCategory.ts` umstellen**

`supabase.from('categories').select('*').eq('project_id', projectId)` → `apiClient.categories.getByProject(projectId!)`

`supabase.from('categories').select('*').eq('id', categoryId)` → `apiClient.categories.getById(categoryId!)`

- [ ] **Step 4: `useSubcategories.ts` umstellen**

Lese die Datei. Falls sie nach `parent_id` filtert, stelle auf `apiClient.categories.getByProject()` um und filtere auf dem Client, oder passe die Route an (Backend-seitig filtern). Wähle die einfachere Option.

- [ ] **Step 5: `useCreateCategory.ts`, `useUpdateCategory.ts`, `useDeleteCategory.ts` umstellen**

Muster:
```typescript
// create: supabase.from('categories').insert({...}) → apiClient.categories.create({...})
// update: supabase.from('categories').update({...}).eq('id', id) → apiClient.categories.update(id, {...})
// delete: supabase.from('categories').delete().eq('id', id) → apiClient.categories.delete(id)
```

- [ ] **Step 6: `useCategoryProgress.ts` umstellen**

Lese die Datei und ersetze die Supabase-Abfragen entsprechend dem apiClient-Muster.

- [ ] **Step 7: Verifizieren — keine Supabase-Imports in diesen Dateien**

```bash
grep -l "supabase" src/hooks/useProject*.ts src/hooks/useCategor*.ts src/hooks/useCreate*.ts src/hooks/useUpdate*.ts src/hooks/useDelete*.ts src/hooks/useSubcat*.ts
```
Expected: Keine Ausgabe.

- [ ] **Step 8: Frontend-Test**

```bash
npm run dev
```
Öffne die App, navigiere zu einem Projekt → Kategorien sollten laden.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/
git commit -m "feat: Projects- und Categories-Hooks auf apiClient umgestellt"
```

---

## Task 12: Hooks migrieren — Artifacts + ArtifactResults + Stats

**Files:**
- Modify: `src/hooks/useArtifacts.ts`
- Modify: `src/hooks/useArtifactResults.ts`
- Modify: `src/hooks/useDeleteArtifact.ts`
- Modify: `src/hooks/useUpdateArtifact.ts`
- Modify: `src/hooks/usePhaseArtifactResultsMap.ts`
- Modify: `src/hooks/useStats.ts`

- [ ] **Step 1: `useArtifacts.ts` umstellen**

```typescript
queryFn: () => apiClient.artifacts.getByCategory(categoryId!)
```

`useArtifactStatusMap`: Nutzt `supabase.from('artifact_results').select('artifact_id, status').in('artifact_id', artifactIds)`. Das Backend hat keinen eigenen Status-Map-Endpoint. Entweder:
- Option A: Alle Results laden via `apiClient.artifactResults.getByArtifact()` und im Frontend aggregieren (mehrere Calls)
- Option B: Neuen Backend-Endpoint `/api/artifacts/status-map` hinzufügen

**Nimm Option A** (YAGNI) — lade alle Results für die Artifact-IDs parallel und berechne die Map im Hook wie bisher.

```typescript
// Für useArtifactStatusMap: ersetze den einzigen supabase-Call
// durch: Promise.all(artifactIds.map(id => apiClient.artifactResults.getByArtifact(id)))
// dann gleiche Aggregierungslogik wie bisher
```

- [ ] **Step 2: `useArtifactResults.ts` umstellen**

Die Auto-Versioning-Logik (2 Supabase-Calls: erst max-version holen, dann insert) ist jetzt im Backend. Der `saveResult`-Call wird zu einem einzigen POST:

```typescript
// saveResult mutation:
mutationFn: ({ artifact_id, result_text, source = 'manual' }) =>
  apiClient.artifactResults.create({ artifact_id, result_text, source })

// setResultFinal mutation:
mutationFn: ({ result_id }) =>
  apiClient.artifactResults.update(result_id, { status: 'final' })
```

- [ ] **Step 3: `useDeleteArtifact.ts`, `useUpdateArtifact.ts` umstellen**

```typescript
// delete: apiClient.artifacts.delete(id)
// update: apiClient.artifacts.update(id, payload)
```

- [ ] **Step 4: `usePhaseArtifactResultsMap.ts` umstellen**

Lese die Datei und ersetze Supabase-Calls entsprechend.

- [ ] **Step 5: `useStats.ts` umstellen**

Lese die Datei. Falls komplexe JOIN-Abfragen vorhanden sind, überprüfe ob ein eigener Stats-Endpoint nötig ist. Falls ja: Route in `server/routes/` ergänzen und apiClient erweitern.

- [ ] **Step 6: Verifizieren**

```bash
grep -l "supabase" src/hooks/useArtifact*.ts src/hooks/usePhase*.ts src/hooks/useStats.ts
```
Expected: Keine Ausgabe.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/
git commit -m "feat: Artifact- und Stats-Hooks auf apiClient umgestellt"
```

---

## Task 13: Hooks migrieren — Templates + PhaseOutputs + ReferenceDocs + Placeholder

**Files:**
- Modify: `src/hooks/useTemplates.ts`
- Modify: `src/hooks/useSaveTemplate.ts`
- Modify: `src/hooks/useUpdateTemplate.ts`
- Modify: `src/hooks/useDeleteTemplate.ts`
- Modify: `src/hooks/useSyncTemplateToArtifacts.ts`
- Modify: `src/hooks/usePhaseOutputTemplates.ts`
- Modify: `src/hooks/useSavePhaseOutputTemplate.ts`
- Modify: `src/hooks/useCategoryPhaseOutput.ts`
- Modify: `src/hooks/useSaveCategoryPhaseOutput.ts`
- Modify: `src/hooks/useDeleteCategoryPhaseOutput.ts`
- Modify: `src/hooks/useCategoryReferenceDocs.ts`
- Modify: `src/hooks/usePlaceholderData.ts`

- [ ] **Step 1: Template-Hooks umstellen**

Muster für alle Template-Hooks:
```typescript
// useTemplates: apiClient.templates.getAll()
// useSaveTemplate: apiClient.templates.create(data)
// useUpdateTemplate: apiClient.templates.update(id, data)
// useDeleteTemplate: apiClient.templates.delete(id)
```

- [ ] **Step 2: `useSyncTemplateToArtifacts.ts` prüfen und umstellen**

Lese die Datei. Sie aktualisiert mehrere Artifacts mit einem Template. Nutze `apiClient.artifacts.update()` in einer Schleife oder füge einen Batch-Endpoint hinzu falls nötig.

- [ ] **Step 3: PhaseOutput-Hooks umstellen**

```typescript
// usePhaseOutputTemplates: apiClient.phaseOutputTemplates.getAll()
// useSavePhaseOutputTemplate: apiClient.phaseOutputTemplates.upsert(phase, data)
// useCategoryPhaseOutput: apiClient.categoryPhaseOutputs.getByCategory(categoryId)
// useSaveCategoryPhaseOutput: apiClient.categoryPhaseOutputs.create(data)
// useDeleteCategoryPhaseOutput: apiClient.categoryPhaseOutputs.delete(id)
```

- [ ] **Step 4: `useCategoryReferenceDocs.ts` umstellen**

```typescript
// getByCategory: apiClient.categoryReferenceDocs.getByCategory(categoryId)
// create/update/delete entsprechend
```

- [ ] **Step 5: `usePlaceholderData.ts` umstellen**

Lese die Datei (hat einen Test `usePlaceholderData.test.ts`). Stelle die Datenzugriffe um und stelle sicher, dass der Test danach noch grün ist.

```bash
npx vitest run src/hooks/usePlaceholderData.test.ts
```
Expected: PASS

- [ ] **Step 6: Gesamt-Check — keine Supabase-Imports in Hooks**

```bash
grep -r "supabase" src/hooks/
```
Expected: Keine Ausgabe.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/
git commit -m "feat: Template-, PhaseOutput- und ReferenceDoc-Hooks auf apiClient umgestellt"
```

---

## Task 14: Supabase-Dependency entfernen

**Files:**
- Delete: `src/lib/supabase.ts` (oder leeren)
- Modify: `package.json`

- [ ] **Step 1: Prüfen ob Supabase noch verwendet wird**

```bash
grep -r "supabase\|@supabase" src/ --include="*.ts" --include="*.tsx"
```
Expected: Keine Treffer (außer `src/types/database.types.ts` — das ist OK, dort steht nur `Database = Record<string, any>`)

- [ ] **Step 2: `src/lib/supabase.ts` löschen**

```bash
git rm src/lib/supabase.ts
```

- [ ] **Step 3: Supabase aus `package.json` entfernen**

```bash
npm uninstall @supabase/supabase-js
```

- [ ] **Step 4: Env-Variablen aufräumen** — `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` aus `.env.local` entfernen (nicht mehr nötig).

- [ ] **Step 5: Build verifizieren**

```bash
npm run lint && npm run test:run && npm run build
```
Expected: Kein Fehler, `dist/` wird erstellt.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Supabase-Dependency vollständig entfernt"
```

---

## Task 15: Docker + Dockerfile

**Files:**
- Create: `docker-compose.yml`
- Modify: `Dockerfile`

- [ ] **Step 1: `docker-compose.yml` erstellen**

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: seo_workflow
      POSTGRES_USER: seo_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  app:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://seo_user:${DB_PASSWORD}@db:5432/seo_workflow
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      PORT: 3000
    depends_on:
      - db

volumes:
  postgres_data:
```

**Hinweis:** `./server/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql` — PostgreSQL führt dieses SQL automatisch beim ersten Start aus (wenn das Volume noch leer ist). Für die Datenmigration: nach dem ersten Start die Daten importieren.

- [ ] **Step 2: `Dockerfile` ersetzen**

Lese den bestehenden Dockerfile, dann ersetze ihn komplett:
```dockerfile
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
```

- [ ] **Step 3: `.env` für Docker anlegen** (nicht committen)

```
DB_PASSWORD=secure-password-here
JWT_SECRET=secure-jwt-secret-here
```

Sicherstellen: `.env` in `.gitignore`.

- [ ] **Step 4: Docker build testen**

```bash
docker compose build
```
Expected: Build erfolgreich ohne Fehler.

- [ ] **Step 5: Docker starten und Login testen**

```bash
docker compose up -d
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123"}' | jq .
```
Expected: `{ "user": {...}, "token": "eyJ..." }`

- [ ] **Step 6: App im Browser testen**

Öffne http://localhost:3000 → Login → Projekte laden.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml Dockerfile .gitignore
git commit -m "feat: Docker-Setup für App + PostgreSQL"
```

---

## Checkliste: Migration vollständig

- [ ] `grep -r "supabase" src/` → keine Treffer
- [ ] `npm run lint && npm run test:run` → grün
- [ ] `npm run build` → kein Fehler
- [ ] `docker compose up` → App läuft auf Port 3000
- [ ] Login + Registrierung funktionieren
- [ ] Projekte laden und erstellen möglich
- [ ] Kategorien + Artifacts + Results funktionieren
