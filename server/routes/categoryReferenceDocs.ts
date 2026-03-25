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
    `SELECT * FROM category_reference_docs WHERE category_id = $1 ORDER BY display_order`,
    [categoryId]
  )
  res.json(result.rows)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { category_id, title, content, display_order } = req.body
  if (!category_id || !title) {
    res.status(400).json({ error: 'category_id and title required' })
    return
  }
  if (!(await categoryBelongsToUser(category_id, req.userId!))) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  const result = await pool.query(
    `INSERT INTO category_reference_docs (category_id, title, content, display_order)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [category_id, title, content ?? '', display_order ?? 0]
  )
  res.status(201).json(result.rows[0])
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  const { title, content, display_order } = req.body
  const result = await pool.query(
    `UPDATE category_reference_docs SET
       title = COALESCE($1, title),
       content = COALESCE($2, content),
       display_order = COALESCE($3, display_order),
       updated_at = NOW()
     WHERE id = $4
       AND category_id IN (
         SELECT c.id FROM categories c JOIN projects p ON p.id = c.project_id
         WHERE p.user_id = $5
       )
     RETURNING *`,
    [title ?? null, content ?? null, display_order ?? null, id, req.userId]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(result.rows[0])
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  const result = await pool.query(
    `DELETE FROM category_reference_docs
     WHERE id = $1
       AND category_id IN (
         SELECT c.id FROM categories c JOIN projects p ON p.id = c.project_id WHERE p.user_id = $2
       )
     RETURNING id`,
    [id, req.userId]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.status(204).send()
})

export default router
