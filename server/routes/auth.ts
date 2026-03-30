import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import {
  signAccessToken,
  generateOpaqueToken,
  hashToken,
  refreshTokenExpiry,
  resetTokenExpiry,
} from '../services/auth-tokens.js'
import { emailService } from '../services/email.js'

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

const COOKIE_NAME = 'refresh_token'
const CLEAR_COOKIE_OPTIONS = {
  httpOnly: COOKIE_OPTIONS.httpOnly,
  secure: COOKIE_OPTIONS.secure,
  sameSite: COOKIE_OPTIONS.sameSite,
}

type AuthUserRow = {
  id: string
  email: string
  password_hash: string
  is_superadmin: boolean
  is_approved: boolean
  created_at?: string
}

async function bootstrapSuperadminIfMissing(preferredUserId?: string): Promise<string | null> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE is_superadmin = TRUE LIMIT 1`
    )
    if (existing.rows[0]) {
      await client.query('COMMIT')
      return existing.rows[0].id
    }

    let userId = preferredUserId ?? null
    if (userId) {
      const preferredUser = await client.query<{ id: string }>(
        `SELECT id FROM users WHERE id = $1`,
        [userId]
      )
      userId = preferredUser.rows[0]?.id ?? null
    }
    if (!userId) {
      const firstUser = await client.query<{ id: string }>(
        `SELECT id
         FROM users
         ORDER BY created_at ASC, id ASC
         LIMIT 1`
      )
      userId = firstUser.rows[0]?.id ?? null
    }
    if (!userId) {
      await client.query('COMMIT')
      return null
    }

    await client.query(
      `UPDATE users
       SET is_superadmin = TRUE,
           is_approved = TRUE,
           approved_at = COALESCE(approved_at, NOW()),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    )
    await client.query('COMMIT')
    return userId
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

function isValidEmail(email: string): boolean {
  const idx = email.indexOf('@')
  return idx > 0 && email.slice(idx).includes('.')
}

function toSafeUser(user: Pick<AuthUserRow, 'id' | 'email' | 'is_superadmin' | 'is_approved' | 'created_at'>) {
  return {
    id: user.id,
    email: user.email,
    is_superadmin: user.is_superadmin,
    is_approved: user.is_approved,
    ...(user.created_at ? { created_at: user.created_at } : {}),
  }
}

async function issueTokens(userId: string, res: Response): Promise<string> {
  const rawRefresh = generateOpaqueToken()
  const tokenHash = hashToken(rawRefresh)
  const expiresAt = refreshTokenExpiry()

  await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()`, [userId])
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  )

  res.cookie(COOKIE_NAME, rawRefresh, COOKIE_OPTIONS)
  return signAccessToken(userId)
}

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
    const result = await pool.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, is_approved) VALUES ($1, $2, FALSE) RETURNING id`,
      [trimmedEmail, password_hash]
    )
    const newUserId = result.rows[0].id
    const bootstrapUserId = await bootstrapSuperadminIfMissing(newUserId)
    if (bootstrapUserId === newUserId) {
      const safeUserResult = await pool.query<AuthUserRow>(
        `SELECT id, email, password_hash, is_superadmin, is_approved, created_at
         FROM users
         WHERE id = $1`,
        [newUserId]
      )
      const user = safeUserResult.rows[0]
      const token = await issueTokens(user.id, res)
      res.status(201).json({
        message: 'Erster Account als Superadmin freigeschaltet.',
        user: toSafeUser(user),
        token,
      })
      return
    }

    res.status(201).json({ message: 'Konto erstellt. Zugriff nach Freigabe durch den Superadmin.' })
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
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

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
    const result = await pool.query<AuthUserRow>(
      `SELECT id, email, password_hash, is_superadmin, is_approved, created_at
       FROM users
       WHERE email = $1`,
      [trimmedEmail]
    )
    const user = result.rows[0]

    let passwordOk = false
    const hashToCompare = user?.password_hash ?? '$2b$10$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    try {
      passwordOk = await bcrypt.compare(String(password), hashToCompare)
    } catch {
      passwordOk = false
    }

    if (!user || !passwordOk) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const bootstrapUserId = await bootstrapSuperadminIfMissing(user.id)
    if (bootstrapUserId === user.id) {
      user.is_superadmin = true
      user.is_approved = true
    }
    if (!user.is_approved) {
      res.status(403).json({ error: 'Konto wartet auf Freigabe durch den Superadmin.' })
      return
    }

    const token = await issueTokens(user.id, res)
    res.json({ user: toSafeUser(user), token })
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

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query<AuthUserRow>(
      `SELECT id, email, created_at, is_superadmin, is_approved, password_hash
       FROM users
       WHERE id = $1`,
      [req.userId]
    )
    const user = result.rows[0]
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(toSafeUser(user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  const rawToken: string | undefined = req.cookies?.refresh_token
  if (!rawToken) {
    res.status(401).json({ error: 'No refresh token' })
    return
  }

  const tokenHash = hashToken(rawToken)
  try {
    const result = await pool.query<{
      id: string
      user_id: string
      email: string
      is_superadmin: boolean
      is_approved: boolean
    }>(
      `SELECT rt.id, rt.user_id, u.email, u.is_superadmin, u.is_approved
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
      [tokenHash]
    )
    const row = result.rows[0]
    if (!row) {
      res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS)
      res.status(401).json({ error: 'Invalid or expired refresh token' })
      return
    }
    if (!row.is_approved) {
      await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [row.user_id]).catch(() => {})
      res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS)
      res.status(403).json({ error: 'Konto wartet auf Freigabe durch den Superadmin.' })
      return
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(`DELETE FROM refresh_tokens WHERE id = $1`, [row.id])
      const rawRefresh = generateOpaqueToken()
      const newHash = hashToken(rawRefresh)
      const expiresAt = refreshTokenExpiry()
      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [row.user_id, newHash, expiresAt]
      )
      await client.query('COMMIT')
      res.cookie(COOKIE_NAME, rawRefresh, COOKIE_OPTIONS)
      const newToken = signAccessToken(row.user_id)
      res.json({
        token: newToken,
        user: {
          id: row.user_id,
          email: row.email,
          is_superadmin: row.is_superadmin,
          is_approved: row.is_approved,
        },
      })
    } catch (txErr) {
      await client.query('ROLLBACK').catch(() => {})
      console.error(txErr)
      res.status(500).json({ error: 'Internal server error' })
    } finally {
      client.release()
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', async (req: Request, res: Response) => {
  const rawToken: string | undefined = req.cookies?.refresh_token
  if (rawToken) {
    const tokenHash = hashToken(rawToken)
    await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]).catch(() => {})
  }
  res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS)
  res.status(204).send()
})

router.post('/forgot-password', async (req: Request, res: Response) => {
  const GENERIC_RESPONSE = { message: 'Falls die E-Mail registriert ist, erhaeltst du einen Link.' }
  const { email } = req.body
  if (!email || !isValidEmail(String(email).trim())) {
    res.json(GENERIC_RESPONSE)
    return
  }

  const trimmedEmail = String(email).trim()
  try {
    const result = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [trimmedEmail])
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
      try {
        await emailService.sendPasswordReset(trimmedEmail, resetUrl)
      } catch (emailErr) {
        console.error(emailErr)
      }
    }
    res.json(GENERIC_RESPONSE)
  } catch (err) {
    console.error(err)
    res.json(GENERIC_RESPONSE)
  }
})

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
    const result = await pool.query<{ user_id: string }>(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [tokenHash]
    )
    const row = result.rows[0]
    if (!row) {
      res.status(400).json({ error: 'Token ungueltig oder abgelaufen.' })
      return
    }

    const password_hash = await bcrypt.hash(String(password), 10)
    await pool.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [password_hash, row.user_id])
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
      [row.user_id]
    )
    await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [row.user_id])
    res.json({ message: 'Passwort erfolgreich geaendert.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
