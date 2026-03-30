import { Response, Router } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../db.js'
import { AuthRequest, requireSuperadmin } from '../middleware/auth.js'

const router = Router()

router.use(requireSuperadmin)

router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, email, is_superadmin, is_approved, approved_at, approved_by, created_at, updated_at
       FROM users
       ORDER BY is_superadmin DESC, is_approved ASC, created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/users/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE users
       SET is_approved = TRUE,
           approved_at = NOW(),
           approved_by = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, is_superadmin, is_approved, approved_at, approved_by, created_at, updated_at`,
      [req.params.id, req.userId]
    )
    const user = result.rows[0]
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/users/:id/revoke', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await pool.query<{ id: string; is_superadmin: boolean }>(
      `SELECT id, is_superadmin FROM users WHERE id = $1`,
      [req.params.id]
    )
    const target = existing.rows[0]
    if (!target) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    if (target.is_superadmin) {
      res.status(400).json({ error: 'Superadmin cannot be revoked' })
      return
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `UPDATE users
         SET is_approved = FALSE,
             approved_at = NULL,
             approved_by = NULL,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, is_superadmin, is_approved, approved_at, approved_by, created_at, updated_at`,
        [req.params.id]
      )
      await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [req.params.id])
      await client.query('COMMIT')
      res.json(result.rows[0])
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

router.post('/users/:id/set-password', async (req: AuthRequest, res: Response) => {
  const password = String(req.body?.password ?? '')
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  try {
    const existing = await pool.query<{ id: string; is_superadmin: boolean }>(
      `SELECT id, is_superadmin FROM users WHERE id = $1`,
      [req.params.id]
    )
    const target = existing.rows[0]
    if (!target) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `UPDATE users
         SET password_hash = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, is_superadmin, is_approved, approved_at, approved_by, created_at, updated_at`,
        [req.params.id, passwordHash]
      )
      await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [req.params.id])
      await client.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`, [req.params.id])
      await client.query('COMMIT')
      res.json(result.rows[0])
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

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await pool.query<{ id: string; is_superadmin: boolean }>(
      `SELECT id, is_superadmin FROM users WHERE id = $1`,
      [req.params.id]
    )
    const target = existing.rows[0]
    if (!target) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    if (target.is_superadmin) {
      res.status(400).json({ error: 'Superadmin cannot be deleted' })
      return
    }
    if (req.userId === req.params.id) {
      res.status(400).json({ error: 'Superadmin cannot delete the current session user' })
      return
    }

    await pool.query(`DELETE FROM users WHERE id = $1`, [req.params.id])
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
