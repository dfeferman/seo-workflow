import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
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
