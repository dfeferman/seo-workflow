import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

async function pageBelongsToUser(pageId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM pages pg
     JOIN projects p ON p.id = pg.project_id
     WHERE pg.id = $1 AND p.user_id = $2`,
    [pageId, userId]
  )
  return (r.rowCount ?? 0) > 0
}

// GET /api/pages/by-project/:projectId
router.get('/by-project/:projectId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT pg.* FROM pages pg
     JOIN projects p ON p.id = pg.project_id
     WHERE pg.project_id = $1 AND p.user_id = $2
     ORDER BY pg.created_at ASC`,
    [routeParamOne(req.params.projectId), req.userId]
  )
  res.json(result.rows)
})

// GET /api/pages/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await pageBelongsToUser(id, req.userId!))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const result = await pool.query(`SELECT * FROM pages WHERE id = $1`, [id])
  res.json(result.rows[0])
})

export default router
