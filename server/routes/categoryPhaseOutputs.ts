import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

async function categoryExists(categoryId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM categories WHERE id = $1`,
    [categoryId]
  )
  return (r.rowCount ?? 0) > 0
}

router.get('/by-category/:categoryId', async (req: AuthRequest, res: Response) => {
  const categoryId = routeParamOne(req.params.categoryId)
  if (!(await categoryExists(categoryId))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const result = await pool.query(
    `SELECT * FROM category_phase_outputs
     WHERE category_id = $1 ORDER BY phase, version DESC`,
    [categoryId]
  )
  res.json(result.rows)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { category_id, phase, output_text, status } = req.body
  if (!category_id || !phase) {
    res.status(400).json({ error: 'category_id and phase required' })
    return
  }
  if (!(await categoryExists(category_id))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const result = await pool.query(
    `WITH next_version AS (
       SELECT COALESCE(MAX(version), 0) + 1 AS v
       FROM category_phase_outputs
       WHERE category_id = $1 AND phase = $2
     )
     INSERT INTO category_phase_outputs (category_id, phase, output_text, version, status)
     SELECT $1, $2, $3, v, $4
     FROM next_version
     RETURNING *`,
    [category_id, phase, output_text ?? null, status ?? 'draft']
  )
  res.status(201).json(result.rows[0])
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  const result = await pool.query(
    `DELETE FROM category_phase_outputs WHERE id = $1 RETURNING id`,
    [id]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.status(204).send()
})

export default router
