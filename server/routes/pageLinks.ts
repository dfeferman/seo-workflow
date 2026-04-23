import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

// GET /api/page-links/by-project/:projectId
router.get('/by-project/:projectId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT pl.* FROM page_links pl
     JOIN projects p ON p.id = pl.project_id
     WHERE pl.project_id = $1 AND p.user_id = $2
     ORDER BY pl.created_at ASC`,
    [routeParamOne(req.params.projectId), req.userId]
  )
  res.json(result.rows)
})

export default router
