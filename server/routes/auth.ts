import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { Response } from 'express'

const router = Router()

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  const trimmedEmail = String(email).trim()
  if (!trimmedEmail.includes('@') || !trimmedEmail.slice(trimmedEmail.indexOf('@')).includes('.')) {
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
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [trimmedEmail, password_hash]
    )
    const user = result.rows[0]
    res.status(201).json({ user, token: signToken(user.id) })
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already registered' })
      return
    }
    if (err.code === '42P01' || err.message?.includes('relation "users" does not exist')) {
      console.error(err)
      res.status(500).json({
        error:
          'Datenbank: Tabelle users fehlt. Wende server/db/schema.sql auf dieselbe Postgres-Instanz an wie DATABASE_URL.',
      })
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
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  const trimmedEmail = String(email).trim()
  if (!trimmedEmail.includes('@') || !trimmedEmail.slice(trimmedEmail.indexOf('@')).includes('.')) {
    res.status(400).json({ error: 'Invalid email format' })
    return
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
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
        passwordOk = await bcrypt.compare(password, user.password_hash)
      } catch {
        passwordOk = false
      }
    }
    if (!user || !passwordOk) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const { password_hash: _, ...safeUser } = user
    res.json({ user: safeUser, token: signToken(user.id) })
  } catch (err: any) {
    if (err.code === '42P01' || err.message?.includes('relation "users" does not exist')) {
      console.error(err)
      res.status(500).json({
        error:
          'Datenbank: Tabelle users fehlt. Wende server/db/schema.sql auf dieselbe Postgres-Instanz an wie DATABASE_URL.',
      })
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

export default router
