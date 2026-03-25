import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM templates WHERE user_id = $1 ORDER BY updated_at DESC`,
    [req.userId]
  )
  res.json(result.rows)
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  const result = await pool.query(
    `SELECT * FROM templates WHERE id = $1 AND user_id = $2`,
    [id, req.userId]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(result.rows[0])
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description, phase, artifact_code, prompt_template, tags } = req.body
  if (!name || !phase || !prompt_template) {
    res.status(400).json({ error: 'name, phase, and prompt_template required' })
    return
  }
  const result = await pool.query(
    `INSERT INTO templates (user_id, name, description, phase, artifact_code, prompt_template, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      req.userId,
      name,
      description ?? null,
      phase,
      artifact_code ?? null,
      prompt_template,
      tags ?? null,
    ]
  )
  res.status(201).json(result.rows[0])
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  const fields = [
    'name',
    'description',
    'phase',
    'artifact_code',
    'prompt_template',
    'tags',
    'usage_count',
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
  values.push(id, req.userId)
  const result = await pool.query(
    `UPDATE templates SET ${updates.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    values
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
    `DELETE FROM templates WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, req.userId]
  )
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.status(204).send()
})

export default router
