import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

// GET /api/projects
router.get('/', async (_req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM projects ORDER BY updated_at DESC`
  )
  res.json(result.rows)
})

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  const result = await pool.query(
    `SELECT * FROM projects WHERE id = $1`,
    [id]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(result.rows[0])
})

// POST /api/projects
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name } = req.body
  if (!name) {
    res.status(400).json({ error: 'name required' })
    return
  }
  const result = await pool.query(
    `INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING *`,
    [req.userId, name]
  )
  res.status(201).json(result.rows[0])
})

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { name } = req.body
  if (name === undefined || name === null || name === '') {
    res.status(400).json({ error: 'name required' })
    return
  }
  const id = routeParamOne(req.params.id)
  const result = await pool.query(
    `UPDATE projects SET name = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [name, id]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(result.rows[0])
})

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  const result = await pool.query(
    `DELETE FROM projects WHERE id = $1 RETURNING id`,
    [id]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.status(204).send()
})

export default router
