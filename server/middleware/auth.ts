import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { coercePgBool, effectiveIsSuperadmin } from '../auth-flags.js'

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

export async function requireSuperadmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  requireAuth(req, res, async () => {
    try {
      const result = await pool.query(
        `SELECT email, is_superadmin, is_approved FROM users WHERE id = $1`,
        [req.userId]
      )
      const user = result.rows[0] as
        | { email?: string; is_superadmin?: boolean; is_approved?: boolean }
        | undefined
      if (!user || typeof user.email !== 'string') {
        res.status(401).json({ error: 'User not found' })
        return
      }
      if (!coercePgBool(user.is_approved)) {
        res.status(403).json({ error: 'Account is not approved' })
        return
      }
      if (!effectiveIsSuperadmin(user.email, user.is_superadmin)) {
        res.status(403).json({ error: 'Superadmin access required' })
        return
      }
      next()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
}
