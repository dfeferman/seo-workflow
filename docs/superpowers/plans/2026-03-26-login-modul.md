# Login-Modul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kern-Login-Flow mit Forgot/Reset Password, httpOnly-Cookie-basiertem Refresh-Token und Passwort-Toggle.

**Architecture:** Access Token (15 min) im React-Memory-State, Refresh Token (7 Tage) als httpOnly-Cookie. Forgot/Reset Password via SHA-256-gehashetem One-Time-Token in PostgreSQL. E-Mail-Service als abstraktes Interface mit Konsolen-Platzhalter.

**Tech Stack:** Node.js/Express, PostgreSQL (pg), bcrypt, jsonwebtoken, cookie-parser, React 18, TanStack Router, lucide-react

---

## Dateiübersicht

| Datei | Aktion |
|-------|--------|
| `server/db/migrations/002_password_reset.sql` | neu — DB-Tabellen |
| `server/services/auth-tokens.ts` | neu — Token-Hilfsfunktionen |
| `server/services/email.ts` | neu — E-Mail-Interface + Platzhalter |
| `server/routes/auth.ts` | erweitert — neue Endpoints, Refresh-Token |
| `server/index.ts` | erweitert — cookie-parser, CORS credentials |
| `server/tests/auth.test.ts` | erweitert — neue Tests |
| `src/lib/apiClient.ts` | umbau — In-Memory-Token, 401-Retry |
| `src/components/AuthProvider.tsx` | umbau — Refresh beim Start, Event-Listener |
| `src/routes/__root.tsx` | erweitert — öffentliche Routen, redirect-Param |
| `src/routes/login.tsx` | erweitert — Toggle, Passwort-vergessen-Link, Redirect |
| `src/routes/signup.tsx` | erweitert — Passwort-Toggle |
| `src/routes/forgot-password.tsx` | neu |
| `src/routes/reset-password.tsx` | neu |

---

## Task 1: DB-Migration

**Files:**
- Create: `server/db/migrations/002_password_reset.sql`

- [ ] **Schritt 1: Migrations-Datei anlegen**

```sql
-- server/db/migrations/002_password_reset.sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_user_id ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
```

- [ ] **Schritt 2: Migration auf der Datenbank ausführen**

```bash
psql $DATABASE_URL -f server/db/migrations/002_password_reset.sql
```

Erwartetes Ergebnis: `CREATE TABLE`, `CREATE INDEX` (je 2×)

- [ ] **Schritt 3: Commit**

```bash
git add server/db/migrations/002_password_reset.sql
git commit -m "feat: DB-Migration für refresh_tokens und password_reset_tokens"
```

---

## Task 2: cookie-parser installieren + server/index.ts aktualisieren

**Files:**
- Modify: `server/index.ts`

- [ ] **Schritt 1: Pakete installieren**

```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

Erwartetes Ergebnis: beide Pakete in `package.json` eingetragen.

- [ ] **Schritt 2: server/index.ts anpassen**

Vollständiger Inhalt der Datei nach der Änderung:

```ts
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import authRouter from './routes/auth.js'
import projectsRouter from './routes/projects.js'
import categoriesRouter from './routes/categories.js'
import artifactsRouter from './routes/artifacts.js'
import artifactResultsRouter from './routes/artifactResults.js'
import templatesRouter from './routes/templates.js'
import phaseOutputTemplatesRouter from './routes/phaseOutputTemplates.js'
import categoryPhaseOutputsRouter from './routes/categoryPhaseOutputs.js'
import categoryReferenceDocsRouter from './routes/categoryReferenceDocs.js'

export const app = express()
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/artifacts', artifactsRouter)
app.use('/api/artifact-results', artifactResultsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/phase-output-templates', phaseOutputTemplatesRouter)
app.use('/api/category-phase-outputs', categoryPhaseOutputsRouter)
app.use('/api/category-reference-docs', categoryReferenceDocsRouter)

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  app.use(express.static(path.join(__dirname, '../')))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
  })
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT ?? 3001
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.JWT_SECRET?.trim()) {
    console.error(
      'FATAL: JWT_SECRET fehlt oder ist leer. Ohne JWT_SECRET schlagen Login und Registrierung mit 500 fehl.\n' +
        'Lege in .env JWT_SECRET an (siehe .env.example, mindestens eine sichere Zeichenkette).'
    )
    process.exit(1)
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
```

- [ ] **Schritt 3: Server starten und prüfen**

```bash
npm run dev
```

Erwartetes Ergebnis: Server startet ohne Fehler. Keine TypeScript-Fehler.

- [ ] **Schritt 4: Commit**

```bash
git add server/index.ts package.json package-lock.json
git commit -m "feat: cookie-parser hinzufügen, CORS credentials aktivieren"
```

---

## Task 3: Auth-Token-Hilfsfunktionen

**Files:**
- Create: `server/services/auth-tokens.ts`

- [ ] **Schritt 1: Datei anlegen**

```ts
// server/services/auth-tokens.ts
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

export function signAccessToken(userId: string): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.sign({ userId }, secret, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): { userId: string } {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.verify(token, secret) as { userId: string }
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000   // 7 Tage
export const RESET_TOKEN_TTL_MS   = 60 * 60 * 1000             // 1 Stunde

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
}

export function resetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS)
}
```

- [ ] **Schritt 2: TypeScript-Kompilierung prüfen**

```bash
cd server && npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Schritt 3: Commit**

```bash
git add server/services/auth-tokens.ts
git commit -m "feat: Auth-Token-Hilfsfunktionen (signAccessToken, hashToken, generateOpaqueToken)"
```

---

## Task 4: E-Mail-Service

**Files:**
- Create: `server/services/email.ts`

- [ ] **Schritt 1: Datei anlegen**

```ts
// server/services/email.ts
export interface EmailService {
  sendPasswordReset(to: string, resetUrl: string): Promise<void>
}

export const consoleEmailService: EmailService = {
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    console.log(`[EMAIL] Passwort-Reset für ${to}`)
    console.log(`[EMAIL] Reset-URL: ${resetUrl}`)
  },
}
```

- [ ] **Schritt 2: Commit**

```bash
git add server/services/email.ts
git commit -m "feat: E-Mail-Service-Interface mit Konsolen-Platzhalter"
```

---

## Task 5: server/routes/auth.ts — Login + Register mit Refresh-Token

**Files:**
- Modify: `server/routes/auth.ts`

Hier wird `signToken` durch `signAccessToken` ersetzt und beide Endpoints geben zusätzlich einen httpOnly-Cookie zurück.

- [ ] **Schritt 1: Datei komplett ersetzen (nur Login/Register-Teil)**

Vollständiger neuer Inhalt der Datei (alle Endpoints folgen in Task 6):

```ts
import { Router } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { Response, Request } from 'express'
import {
  signAccessToken,
  generateOpaqueToken,
  hashToken,
  refreshTokenExpiry,
  resetTokenExpiry,
} from '../services/auth-tokens.js'
import { consoleEmailService } from '../services/email.js'

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage in ms
}

function isValidEmail(email: string): boolean {
  const idx = email.indexOf('@')
  return idx > 0 && email.slice(idx).includes('.')
}

async function issueTokens(userId: string, res: Response): Promise<string> {
  const rawRefresh = generateOpaqueToken()
  const tokenHash = hashToken(rawRefresh)
  const expiresAt = refreshTokenExpiry()

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  )

  res.cookie('refresh_token', rawRefresh, COOKIE_OPTIONS)
  return signAccessToken(userId)
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  const trimmedEmail = String(email).trim()
  if (!isValidEmail(trimmedEmail)) {
    res.status(400).json({ error: 'Invalid email format' })
    return
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }
  try {
    const password_hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [trimmedEmail, password_hash]
    )
    const user = result.rows[0]
    const token = await issueTokens(user.id, res)
    res.status(201).json({ user, token })
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already registered' })
      return
    }
    if (err.code === '42P01' || err.message?.includes('relation "users" does not exist')) {
      console.error(err)
      res.status(500).json({ error: 'Datenbank: Tabelle users fehlt.' })
      return
    }
    if (err.message === 'JWT_SECRET is not configured') {
      res.status(503).json({ error: 'Server: JWT_SECRET ist nicht gesetzt.' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  const trimmedEmail = String(email).trim()
  if (!isValidEmail(trimmedEmail)) {
    res.status(400).json({ error: 'Invalid email format' })
    return
  }
  try {
    const result = await pool.query(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [trimmedEmail]
    )
    const user = result.rows[0]
    let passwordOk = false
    if (user?.password_hash) {
      try {
        passwordOk = await bcrypt.compare(String(password), user.password_hash)
      } catch {
        passwordOk = false
      }
    }
    if (!user || !passwordOk) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const { password_hash: _, ...safeUser } = user
    const token = await issueTokens(user.id, res)
    res.json({ user: safeUser, token })
  } catch (err: any) {
    if (err.code === '42P01' || err.message?.includes('relation "users" does not exist')) {
      console.error(err)
      res.status(500).json({ error: 'Datenbank: Tabelle users fehlt.' })
      return
    }
    if (err.message === 'JWT_SECRET is not configured') {
      res.status(503).json({ error: 'Server: JWT_SECRET ist nicht gesetzt.' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, created_at FROM users WHERE id = $1`,
      [req.userId]
    )
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const rawToken: string | undefined = req.cookies?.refresh_token
  if (!rawToken) {
    res.status(401).json({ error: 'No refresh token' })
    return
  }
  const tokenHash = hashToken(rawToken)
  try {
    const result = await pool.query(
      `SELECT rt.id, rt.user_id, u.email
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
      [tokenHash]
    )
    const row = result.rows[0]
    if (!row) {
      res.clearCookie('refresh_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
      res.status(401).json({ error: 'Invalid or expired refresh token' })
      return
    }
    // Token rotation: delete old, issue new
    await pool.query(`DELETE FROM refresh_tokens WHERE id = $1`, [row.id])
    const newToken = await issueTokens(row.user_id, res)
    res.json({ token: newToken, user: { id: row.user_id, email: row.email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  const rawToken: string | undefined = req.cookies?.refresh_token
  if (rawToken) {
    const tokenHash = hashToken(rawToken)
    await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]).catch(() => {})
  }
  res.clearCookie('refresh_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
  res.status(204).send()
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const GENERIC_RESPONSE = { message: 'Falls die E-Mail registriert ist, erhältst du einen Link.' }
  const { email } = req.body
  if (!email || !isValidEmail(String(email).trim())) {
    res.json(GENERIC_RESPONSE)
    return
  }
  const trimmedEmail = String(email).trim()
  try {
    const result = await pool.query(`SELECT id FROM users WHERE email = $1`, [trimmedEmail])
    const user = result.rows[0]
    if (user) {
      const rawToken = generateOpaqueToken()
      const tokenHash = hashToken(rawToken)
      const expiresAt = resetTokenExpiry()
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      )
      const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`
      await consoleEmailService.sendPasswordReset(trimmedEmail, resetUrl)
    }
    res.json(GENERIC_RESPONSE)
  } catch (err) {
    console.error(err)
    res.json(GENERIC_RESPONSE) // immer generisch antworten
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body
  if (!token || !password) {
    res.status(400).json({ error: 'token and password required' })
    return
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }
  const tokenHash = hashToken(String(token))
  try {
    const result = await pool.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [tokenHash]
    )
    const row = result.rows[0]
    if (!row) {
      res.status(400).json({ error: 'Token ungültig oder abgelaufen.' })
      return
    }
    const password_hash = await bcrypt.hash(String(password), 10)
    await pool.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [password_hash, row.user_id])
    await pool.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [row.id])
    res.json({ message: 'Passwort erfolgreich geändert.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
```

- [ ] **Schritt 2: TypeScript-Kompilierung prüfen**

```bash
cd server && npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Schritt 3: Commit**

```bash
git add server/routes/auth.ts
git commit -m "feat: Auth-Endpoints mit Refresh-Token, Forgot/Reset Password"
```

---

## Task 6: Backend-Tests erweitern

**Files:**
- Modify: `server/tests/auth.test.ts`

- [ ] **Schritt 1: Bestehende Tests anpassen + neue hinzufügen**

Vollständiger Inhalt der Datei:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../index.js'
import { pool } from '../db.js'

const TEST_EMAIL = 'test-auth@example.com'
const TEST_PW = 'password123'

beforeAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL])
})

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL])
  await pool.end()
})

describe('POST /api/auth/register', () => {
  it('creates a user, returns access token and sets refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(TEST_EMAIL)
    expect(res.headers['set-cookie']).toBeDefined()
    const cookie: string = res.headers['set-cookie'][0]
    expect(cookie).toContain('refresh_token=')
    expect(cookie).toContain('HttpOnly')
  })

  it('returns 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('returns access token and sets refresh cookie for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns user for valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const token = loginRes.body.token

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe(TEST_EMAIL)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  it('returns new access token with valid cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const cookie: string = loginRes.headers['set-cookie'][0].split(';')[0] // "refresh_token=xxx"

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(TEST_EMAIL)
  })

  it('returns 401 with no cookie', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
  })

  it('rotates the refresh token (old token becomes invalid)', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const oldCookie: string = loginRes.headers['set-cookie'][0].split(';')[0]

    // First refresh
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie)
    expect(refreshRes.status).toBe(200)

    // Old cookie must now be invalid
    const retryRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie)
    expect(retryRes.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('invalidates the refresh token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PW })
    const cookie: string = loginRes.headers['set-cookie'][0].split(';')[0]

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
    expect(logoutRes.status).toBe(204)

    // Token must now be invalid
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
    expect(refreshRes.status).toBe(401)
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('returns generic success for known email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_EMAIL })
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
  })

  it('returns same generic response for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@example.com' })
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
  })
})

describe('POST /api/auth/reset-password', () => {
  async function getResetToken(): Promise<string> {
    // Trigger forgot-password to create a token in DB, then read it directly
    await request(app).post('/api/auth/forgot-password').send({ email: TEST_EMAIL })
    const result = await pool.query(
      `SELECT prt.id, prt.token_hash
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE u.email = $1 AND prt.used_at IS NULL
       ORDER BY prt.created_at DESC LIMIT 1`,
      [TEST_EMAIL]
    )
    // We stored the hash, not the raw token — so we must insert a known raw token directly
    const { hashToken, generateOpaqueToken } = await import('../services/auth-tokens.js')
    const rawToken = generateOpaqueToken()
    const tokenHash = hashToken(rawToken)
    const userRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [TEST_EMAIL])
    const userId = userRes.rows[0].id
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, tokenHash]
    )
    return rawToken
  }

  it('resets password with valid token', async () => {
    const token = await getResetToken()
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'newpassword99' })
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()

    // Verify new password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'newpassword99' })
    expect(loginRes.status).toBe(200)

    // Restore original password for subsequent tests
    await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'newpassword99' })
    // Re-register won't work; update directly
    const bcrypt = await import('bcrypt')
    const hash = await bcrypt.hash(TEST_PW, 10)
    await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, TEST_EMAIL])
  })

  it('returns 400 for already-used token', async () => {
    const token = await getResetToken()
    await request(app).post('/api/auth/reset-password').send({ token, password: 'somepassword1' })
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'anotherpass2' })
    expect(res.status).toBe(400)

    // Restore
    const bcrypt = await import('bcrypt')
    const hash = await bcrypt.hash(TEST_PW, 10)
    await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, TEST_EMAIL])
  })

  it('returns 400 for invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'completely-invalid-token', password: 'newpassword99' })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Schritt 2: Tests ausführen**

```bash
npx vitest run server/tests/auth.test.ts
```

Erwartetes Ergebnis: alle Tests grün.

- [ ] **Schritt 3: Commit**

```bash
git add server/tests/auth.test.ts
git commit -m "test: Backend-Auth-Tests für Refresh, Logout, Forgot/Reset Password"
```

---

## Task 7: apiClient — In-Memory-Token + 401-Retry

**Files:**
- Modify: `src/lib/apiClient.ts`

- [ ] **Schritt 1: Vollständigen Inhalt ersetzen**

```ts
// Zentrales API-Abstraktionslayer. Alle Datenzugriffe laufen über dieses Modul.

const BASE_URL = '' // Vite-Proxy leitet /api/* weiter; in Prod: gleicher Origin

let _token: string | null = null
let _isRefreshing = false

function getToken(): string | null {
  return _token
}

export function setToken(token: string): void {
  _token = token
}

export function clearToken(): void {
  _token = null
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  skipRetry = false
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !skipRetry && !_isRefreshing) {
    _isRefreshing = true
    try {
      const data = await request<{ token: string }>(
        'POST',
        '/api/auth/refresh',
        undefined,
        true
      )
      setToken(data.token)
      _isRefreshing = false
      return request<T>(method, path, body, true)
    } catch {
      _isRefreshing = false
      clearToken()
      window.dispatchEvent(new Event('auth:signout'))
      throw new Error('Session abgelaufen. Bitte erneut anmelden.')
    }
  }

  if (!res.ok) {
    const text = await res.text()
    let message = text?.trim() || `Request failed: ${res.status}`
    try {
      const j = JSON.parse(text) as { error?: string }
      if (typeof j?.error === 'string' && j.error) message = j.error
    } catch {
      /* Body ist kein JSON */
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const apiClient = {
  auth: {
    register: (email: string, password: string) =>
      request<{ user: any; token: string }>('POST', '/api/auth/register', { email, password }, true),
    login: (email: string, password: string) =>
      request<{ user: any; token: string }>('POST', '/api/auth/login', { email, password }, true),
    me: () => request<any>('GET', '/api/auth/me'),
    refresh: () =>
      request<{ token: string; user: any }>('POST', '/api/auth/refresh', undefined, true),
    logout: () => request<void>('POST', '/api/auth/logout', undefined, true),
    forgotPassword: (email: string) =>
      request<{ message: string }>('POST', '/api/auth/forgot-password', { email }, true),
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('POST', '/api/auth/reset-password', { token, password }, true),
  },

  projects: {
    getAll: () => request<any[]>('GET', '/api/projects'),
    getById: (id: string) => request<any>('GET', `/api/projects/${id}`),
    create: (data: { name: string }) => request<any>('POST', '/api/projects', data),
    update: (id: string, data: Partial<{ name: string }>) =>
      request<any>('PUT', `/api/projects/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/projects/${id}`),
  },

  categories: {
    getByProject: (projectId: string) =>
      request<any[]>('GET', `/api/categories/by-project/${projectId}`),
    getById: (id: string) => request<any>('GET', `/api/categories/${id}`),
    create: (data: any) => request<any>('POST', '/api/categories', data),
    update: (id: string, data: any) => request<any>('PUT', `/api/categories/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/categories/${id}`),
  },

  artifacts: {
    getByCategory: (categoryId: string) =>
      request<any[]>('GET', `/api/artifacts/by-category/${categoryId}`),
    getByTemplate: (templateId: string) =>
      request<any[]>('GET', `/api/artifacts/by-template/${templateId}`),
    getByPhaseCode: (phase: string, artifactCode: string) =>
      request<any[]>(
        'GET',
        `/api/artifacts/by-phase-code?phase=${encodeURIComponent(phase)}&code=${encodeURIComponent(artifactCode)}`
      ),
    getById: (id: string) => request<any>('GET', `/api/artifacts/${id}`),
    create: (data: any) => request<any>('POST', '/api/artifacts', data),
    update: (id: string, data: any) => request<any>('PUT', `/api/artifacts/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/artifacts/${id}`),
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
    getAll: () => request<any[]>('GET', '/api/templates'),
    getById: (id: string) => request<any>('GET', `/api/templates/${id}`),
    create: (data: any) => request<any>('POST', '/api/templates', data),
    update: (id: string, data: any) => request<any>('PUT', `/api/templates/${id}`, data),
    delete: (id: string) => request<void>('DELETE', `/api/templates/${id}`),
  },

  phaseOutputTemplates: {
    getAll: () => request<any[]>('GET', '/api/phase-output-templates'),
    upsert: (phase: string, data: { template_text: string; description?: string }) =>
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

- [ ] **Schritt 2: TypeScript-Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: kein TypeScript-Fehler.

- [ ] **Schritt 3: Commit**

```bash
git add src/lib/apiClient.ts
git commit -m "feat: apiClient auf In-Memory-Token umstellen, 401-Retry mit Refresh"
```

---

## Task 8: AuthProvider umbauen

**Files:**
- Modify: `src/components/AuthProvider.tsx`

- [ ] **Schritt 1: Vollständigen Inhalt ersetzen**

```tsx
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

function normalizeUser(u: unknown): AppUser | null {
  if (!u || typeof u !== 'object') return null
  const row = u as { id?: string; email?: string }
  if (typeof row.id !== 'string' || typeof row.email !== 'string') return null
  return { id: row.id, email: row.email }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Beim App-Start: Session via Refresh-Token-Cookie wiederherstellen
  useEffect(() => {
    apiClient.auth
      .refresh()
      .then(({ token, user: u }) => {
        setToken(token)
        setUser(normalizeUser(u))
      })
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Beim apiClient-seitigen Signout-Event (z.B. Refresh fehlgeschlagen nach Retry)
  useEffect(() => {
    const handleSignout = () => setUser(null)
    window.addEventListener('auth:signout', handleSignout)
    return () => window.removeEventListener('auth:signout', handleSignout)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiClient.auth.login(email, password)
    setToken(token)
    setUser(normalizeUser(u))
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiClient.auth.register(email, password)
    setToken(token)
    setUser(normalizeUser(u))
  }, [])

  const signOut = useCallback(() => {
    apiClient.auth.logout().catch(() => {}) // best effort
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

- [ ] **Schritt 2: Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Schritt 3: Commit**

```bash
git add src/components/AuthProvider.tsx
git commit -m "feat: AuthProvider auf Refresh-Token-Cookie umstellen, localStorage entfernt"
```

---

## Task 9: __root.tsx — öffentliche Routen + redirect-Param

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Schritt 1: Vollständigen Inhalt ersetzen**

```tsx
import { Suspense } from 'react'
import { createRootRoute, Outlet, useLocation, Navigate } from '@tanstack/react-router'
import { Layout } from '@/components/Layout'
import { NotFound } from '@/components/NotFound'
import { useAuth } from '@/hooks/useAuth'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password']

function RootComponent() {
  const { pathname } = useLocation()
  const { user, loading } = useAuth()
  const isPublicPage = PUBLIC_PATHS.includes(pathname)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Laden…</p>
      </div>
    )
  }

  if (isPublicPage) {
    return <Outlet />
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} />
  }

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center bg-slate-100">
            <p className="text-slate-500 text-sm">Laden…</p>
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </Layout>
  )
}
```

- [ ] **Schritt 2: Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: keine Fehler. TanStack Router generiert `routeTree.gen.ts` neu.

- [ ] **Schritt 3: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: öffentliche Routen erweitert, redirect-Param bei geschützten Routen"
```

---

## Task 10: login.tsx — Passwort-Toggle, Passwort-vergessen-Link, Redirect

**Files:**
- Modify: `src/routes/login.tsx`

- [ ] **Schritt 1: Vollständigen Inhalt ersetzen**

```tsx
import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { redirect } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      const target = redirect && redirect.startsWith('/') ? redirect : '/'
      navigate({ to: target })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-8 shadow-md hover:border-slate-200 transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SEO Workflow</h1>
            <p className="text-xs text-slate-500">Anmelden</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="deine@email.de"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Passwort
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:underline"
              >
                Passwort vergessen?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500 text-center">
          Noch kein Konto?{' '}
          <Link to="/signup" className="text-blue-600 font-medium hover:underline">
            Konto anlegen
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Schritt 2: Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Schritt 3: Commit**

```bash
git add src/routes/login.tsx
git commit -m "feat: Login — Passwort-Toggle, Passwort-vergessen-Link, Redirect nach Login"
```

---

## Task 11: signup.tsx — Passwort-Toggle

**Files:**
- Modify: `src/routes/signup.tsx`

- [ ] **Schritt 1: Vollständigen Inhalt ersetzen**

```tsx
import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(email, password)
      navigate({ to: '/' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registrierung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SEO Workflow</h1>
            <p className="text-xs text-slate-500">Konto anlegen</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">
              E-Mail
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="deine@email.de"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1">
              Passwort
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Mindestens 8 Zeichen</p>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {loading ? 'Wird erstellt…' : 'Konto anlegen'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500 text-center">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
```

Hinweis: `minLength` im Input auf 8 geändert (war 6).

- [ ] **Schritt 2: Build prüfen**

```bash
npm run build
```

- [ ] **Schritt 3: Commit**

```bash
git add src/routes/signup.tsx
git commit -m "feat: Signup — Passwort-Toggle, minLength auf 8"
```

---

## Task 12: forgot-password.tsx

**Files:**
- Create: `src/routes/forgot-password.tsx`

- [ ] **Schritt 1: Datei anlegen**

```tsx
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { apiClient } from '@/lib/apiClient'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiClient.auth.forgotPassword(email)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Senden')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-2xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">E-Mail gesendet</h2>
          <p className="text-sm text-slate-500 mb-4">
            Falls die E-Mail registriert ist, erhältst du in Kürze einen Link zum Zurücksetzen deines Passworts.
          </p>
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SEO Workflow</h1>
            <p className="text-xs text-slate-500">Passwort zurücksetzen</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1">
              E-Mail
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="deine@email.de"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {loading ? 'Wird gesendet…' : 'Link anfordern'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500 text-center">
          <Link to="/login" className="text-blue-600 hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Schritt 2: Build + Router-Tree prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: `src/routeTree.gen.ts` enthält `/forgot-password`, keine Fehler.

- [ ] **Schritt 3: Commit**

```bash
git add src/routes/forgot-password.tsx
git commit -m "feat: /forgot-password Route"
```

---

## Task 13: reset-password.tsx

**Files:**
- Create: `src/routes/reset-password.tsx`

- [ ] **Schritt 1: Datei anlegen**

```tsx
import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-lg text-center">
          <p className="text-sm text-slate-600 mb-4">
            Ungültiger oder fehlender Reset-Link.
          </p>
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-2xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Passwort geändert</h2>
          <p className="text-sm text-slate-500 mb-4">Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await apiClient.auth.resetPassword(token, password)
      setSuccess(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Zurücksetzen'
      setError(msg + ' — Bitte fordere einen neuen Link an.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SEO Workflow</h1>
            <p className="text-xs text-slate-500">Neues Passwort setzen</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
              Neues Passwort
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Mindestens 8 Zeichen</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
              Passwort bestätigen
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}{' '}
              <Link to="/forgot-password" className="underline">
                Neuen Link anfordern
              </Link>
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Schritt 2: Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: `src/routeTree.gen.ts` enthält `/reset-password`, keine Fehler.

- [ ] **Schritt 3: Abschliessender Smoketest**

```bash
npm run lint && npm run test:run
```

Erwartetes Ergebnis: kein Lint-Fehler, alle Frontend-Tests grün.

- [ ] **Schritt 4: Commit**

```bash
git add src/routes/reset-password.tsx
git commit -m "feat: /reset-password Route — vollständiger Login-Modul-Kern-Flow"
```

---

## Checkliste Spec-Coverage

| Spec-Anforderung | Task |
|-----------------|------|
| DB: refresh_tokens, password_reset_tokens | Task 1 |
| cookie-parser, CORS credentials | Task 2 |
| signAccessToken 15min, hashToken | Task 3 |
| E-Mail-Service Interface + Platzhalter | Task 4 |
| Login/Register + Refresh-Token-Cookie | Task 5 |
| POST /refresh (Token Rotation) | Task 5 |
| POST /logout | Task 5 |
| POST /forgot-password (generisch) | Task 5 |
| POST /reset-password | Task 5 |
| Backend-Tests | Task 6 |
| apiClient In-Memory + 401-Retry | Task 7 |
| AuthProvider Refresh beim Start | Task 8 |
| auth:signout Event-Listener | Task 8 |
| __root.tsx öffentliche Routen + redirect | Task 9 |
| login.tsx Toggle + Link + Redirect | Task 10 |
| signup.tsx Toggle | Task 11 |
| /forgot-password Route | Task 12 |
| /reset-password Route | Task 13 |
