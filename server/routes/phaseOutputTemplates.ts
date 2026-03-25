import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM phase_output_templates WHERE user_id = $1 ORDER BY phase`,
    [req.userId]
  )
  res.json(result.rows)
})

// PUT /api/phase-output-templates/:phase (Upsert)
router.put('/:phase', async (req: AuthRequest, res: Response) => {
  const phase = routeParamOne(req.params.phase)
  const { template_text, description } = req.body
  const result = await pool.query(
    `INSERT INTO phase_output_templates (user_id, phase, template_text, description)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, phase)
     DO UPDATE SET template_text = EXCLUDED.template_text,
                   description = EXCLUDED.description,
                   updated_at = NOW()
     RETURNING *`,
    [req.userId, phase, template_text ?? '', description ?? null]
  )
  res.json(result.rows[0])
})

export default router
