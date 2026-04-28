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

// GET /api/categories/by-project/:projectId — vor /:id registrieren
router.get('/by-project/:projectId', async (req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM categories
     WHERE project_id = $1
     ORDER BY display_order ASC`,
    [routeParamOne(req.params.projectId)]
  )
  res.json(result.rows)
})

// GET /api/categories/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await categoryExists(id))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const result = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id])
  res.json(result.rows[0])
})

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response) => {
  const {
    project_id,
    parent_id,
    name,
    type,
    hub_name,
    zielgruppen,
    shop_typ,
    usps,
    ton,
    no_gos,
    display_order,
    custom_placeholders,
  } = req.body

  if (!project_id || !name) {
    res.status(400).json({ error: 'project_id and name required' })
    return
  }

  const pCheck = await pool.query(
    `SELECT 1 FROM projects WHERE id = $1`,
    [project_id]
  )
  if ((pCheck.rowCount ?? 0) === 0) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const result = await pool.query(
    `INSERT INTO categories
       (project_id, parent_id, name, type, hub_name, zielgruppen, shop_typ, usps, ton, no_gos, display_order, custom_placeholders)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      project_id,
      parent_id ?? null,
      name,
      type ?? 'category',
      hub_name ?? null,
      zielgruppen ?? null,
      shop_typ ?? null,
      usps ?? null,
      ton ?? null,
      no_gos ?? null,
      display_order ?? 0,
      custom_placeholders ?? {},
    ]
  )
  res.status(201).json(result.rows[0])
})

// PUT /api/categories/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await categoryExists(id))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const fields = [
    'name',
    'hub_name',
    'zielgruppen',
    'shop_typ',
    'usps',
    'ton',
    'no_gos',
    'display_order',
    'custom_placeholders',
    'parent_id',
    'type',
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
    `UPDATE categories SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  res.json(result.rows[0])
})

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await categoryExists(id))) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await pool.query(`DELETE FROM categories WHERE id = $1`, [id])
  res.status(204).send()
})

export default router
