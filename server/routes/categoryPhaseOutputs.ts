import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

async function categoryBelongsToUser(categoryId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM categories c JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1 AND p.user_id = $2`,
    [categoryId, userId]
  )
  return (r.rowCount ?? 0) > 0
}

router.get('/by-category/:categoryId', async (req: AuthRequest, res: Response) => {
  const categoryId = routeParamOne(req.params.categoryId)
  if (!(await categoryBelongsToUser(categoryId, req.userId!))) {
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
  if (!(await categoryBelongsToUser(category_id, req.userId!))) {
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
    `DELETE FROM category_phase_outputs cpo
     USING categories c, projects p
     WHERE cpo.id = $1
       AND cpo.category_id = c.id
       AND c.project_id = p.id
       AND p.user_id = $2
     RETURNING cpo.id`,
    [id, req.userId]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.status(204).send()
})

export default router
