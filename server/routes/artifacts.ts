import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

async function artifactExists(artifactId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM artifacts WHERE id = $1`,
    [artifactId]
  )
  return (r.rowCount ?? 0) > 0
}

// GET /api/artifacts/by-category/:categoryId — vor /:id
router.get('/by-category/:categoryId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM artifacts
     WHERE category_id = $1
     ORDER BY display_order ASC`,
    [routeParamOne(req.params.categoryId)]
  )
  res.json(result.rows)
})

// GET /api/artifacts/by-template/:templateId — für Template→Artefakt-Sync
router.get('/by-template/:templateId', async (req: AuthRequest, res: Response) => {
  const templateId = routeParamOne(req.params.templateId)
  const result = await pool.query(
    `SELECT id, template_id, artifact_code, phase FROM artifacts
     WHERE template_id = $1`,
    [templateId]
  )
  res.json(result.rows)
})

// GET /api/artifacts/by-phase-code?phase=B&code=B2.1
router.get('/by-phase-code', async (req: AuthRequest, res: Response) => {
  const phase = typeof req.query.phase === 'string' ? req.query.phase : ''
  const code = typeof req.query.code === 'string' ? req.query.code : ''
  if (!phase || !code) {
    res.status(400).json({ error: 'phase and code query params required' })
    return
  }
  const phaseNorm = phase.toUpperCase().trim().slice(0, 1)
  const result = await pool.query(
    `SELECT id, template_id, artifact_code, phase FROM artifacts
     WHERE phase = $1 AND artifact_code = $2`,
    [phaseNorm, code.trim()]
  )
  res.json(result.rows)
})

// GET /api/artifacts/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await artifactExists(id))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const result = await pool.query(`SELECT * FROM artifacts WHERE id = $1`, [id])
  res.json(result.rows[0])
})

// POST /api/artifacts
router.post('/', async (req: AuthRequest, res: Response) => {
  const {
    category_id,
    phase,
    artifact_code,
    name,
    description,
    prompt_template,
    recommended_source,
    estimated_duration_minutes,
    display_order,
    template_id,
  } = req.body

  if (!category_id || !phase || !artifact_code || !name || !prompt_template) {
    res
      .status(400)
      .json({ error: 'category_id, phase, artifact_code, name, and prompt_template required' })
    return
  }

  const check = await pool.query(
    `SELECT 1 FROM categories WHERE id = $1`,
    [category_id]
  )
  if ((check.rowCount ?? 0) === 0) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const result = await pool.query(
    `INSERT INTO artifacts
       (category_id, phase, artifact_code, name, description, prompt_template,
        recommended_source, estimated_duration_minutes, display_order, template_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      category_id,
      phase,
      artifact_code,
      name,
      description ?? null,
      prompt_template,
      recommended_source ?? null,
      estimated_duration_minutes ?? null,
      display_order ?? 0,
      template_id ?? null,
    ]
  )
  res.status(201).json(result.rows[0])
})

// PUT /api/artifacts/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await artifactExists(id))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const fields = [
    'name',
    'description',
    'prompt_template',
    'phase',
    'artifact_code',
    'recommended_source',
    'estimated_duration_minutes',
    'display_order',
    'template_id',
  ] as const
  const updates: string[] = []
  const values: unknown[] = []
  let idx = 1
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`)
      values.push(req.body[f])
    }
  }
  updates.push(`updated_at = NOW()`)
  values.push(id)
  const result = await pool.query(
    `UPDATE artifacts SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  res.json(result.rows[0])
})

// DELETE /api/artifacts/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await artifactExists(id))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await pool.query(`DELETE FROM artifacts WHERE id = $1`, [id])
  res.status(204).send()
})

export default router
