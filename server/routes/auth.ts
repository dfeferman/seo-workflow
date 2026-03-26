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
