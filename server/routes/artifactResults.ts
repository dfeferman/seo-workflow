import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

async function resultBelongsToUser(resultId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM artifact_results ar
     JOIN artifacts a ON a.id = ar.artifact_id
     JOIN categories c ON c.id = a.category_id
     JOIN projects p ON p.id = c.project_id
     WHERE ar.id = $1 AND p.user_id = $2`,
    [resultId, userId]
  )
  return (r.rowCount ?? 0) > 0
}

// GET /api/artifact-results/by-artifact/:artifactId — vor /:id
router.get('/by-artifact/:artifactId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT ar.* FROM artifact_results ar
     JOIN artifacts a ON a.id = ar.artifact_id
     JOIN categories c ON c.id = a.category_id
     JOIN projects p ON p.id = c.project_id
     WHERE ar.artifact_id = $1 AND p.user_id = $2
     ORDER BY ar.version DESC`,
    [routeParamOne(req.params.artifactId), req.userId]
  )
  res.json(result.rows)
})

// POST /api/artifact-results (Auto-Versioning)
router.post('/', async (req: AuthRequest, res: Response) => {
  const { artifact_id, result_text, source = 'manual' } = req.body

  if (!artifact_id) {
    res.status(400).json({ error: 'artifact_id required' })
    return
  }

  const check = await pool.query(
    `SELECT 1 FROM artifacts a
     JOIN categories c ON c.id = a.category_id
     JOIN projects p ON p.id = c.project_id
     WHERE a.id = $1 AND p.user_id = $2`,
    [artifact_id, req.userId]
  )
  if ((check.rowCount ?? 0) === 0) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const result = await pool.query(
    `WITH next_version AS (
       SELECT COALESCE(MAX(version), 0) + 1 AS v
       FROM artifact_results
       WHERE artifact_id = $1
     )
     INSERT INTO artifact_results (artifact_id, result_text, source, version, status)
     SELECT $1, $2, $3, v, $4
     FROM next_version
     RETURNING *`,
    [artifact_id, result_text ?? null, source, 'draft']
  )
  res.status(201).json(result.rows[0])
})

// PUT /api/artifact-results/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await resultBelongsToUser(id, req.userId!))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const { status, result_text } = req.body
  const updates: string[] = []
  const values: unknown[] = []
  let idx = 1
  if (status !== undefined) {
    updates.push(`status = $${idx++}`)
    values.push(status)
  }
  if (result_text !== undefined) {
    updates.push(`result_text = $${idx++}`)
    values.push(result_text)
  }
  updates.push(`updated_at = NOW()`)
  values.push(id)
  const result = await pool.query(
    `UPDATE artifact_results SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  res.json(result.rows[0])
})

export default router
