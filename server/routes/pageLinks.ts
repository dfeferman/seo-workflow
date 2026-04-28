import { Router, Response } from 'express'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'

const router = Router()
router.use(requireAuth)

async function projectOwnedByUser(projectId: string, userId: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM projects WHERE id = $1 AND user_id = $2`, [
    projectId,
    userId,
  ])
  return (r.rowCount ?? 0) > 0
}

async function pageInProject(pageId: string, projectId: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM pages WHERE id = $1 AND project_id = $2`, [
    pageId,
    projectId,
  ])
  return (r.rowCount ?? 0) > 0
}

function pgUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === '23505'
}

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

// POST /api/page-links
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body as Record<string, unknown>
    const project_id = b.project_id
    const from_page_id = b.from_page_id
    const to_page_id = b.to_page_id

    if (typeof project_id !== 'string' || typeof from_page_id !== 'string' || typeof to_page_id !== 'string') {
      res.status(400).json({ error: 'project_id, from_page_id und to_page_id sind erforderlich' })
      return
    }
    if (from_page_id === to_page_id) {
      res.status(400).json({ error: 'Quelle und Ziel müssen verschiedene Seiten sein' })
      return
    }

    if (!(await projectOwnedByUser(project_id, req.userId!))) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const okFrom = await pageInProject(from_page_id, project_id)
    const okTo = await pageInProject(to_page_id, project_id)
    if (!okFrom || !okTo) {
      res.status(400).json({ error: 'Seiten gehören nicht zu diesem Projekt' })
      return
    }

    const anchor_text = typeof b.anchor_text === 'string' ? b.anchor_text.slice(0, 500) : null
    const context_sentence = typeof b.context_sentence === 'string' ? b.context_sentence : null
    const placement = typeof b.placement === 'string' ? b.placement.slice(0, 100) : null

    let line_number_start: number | null =
      typeof b.line_number_start === 'number' && Number.isFinite(b.line_number_start)
        ? Math.trunc(b.line_number_start)
        : null
    let line_number_end: number | null =
      typeof b.line_number_end === 'number' && Number.isFinite(b.line_number_end)
        ? Math.trunc(b.line_number_end)
        : line_number_start

    try {
      const result = await pool.query(
        `INSERT INTO page_links (
           project_id, from_page_id, to_page_id, anchor_text, context_sentence, placement,
           line_number_start, line_number_end
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          project_id,
          from_page_id,
          to_page_id,
          anchor_text,
          context_sentence,
          placement,
          line_number_start,
          line_number_end,
        ]
      )
      res.status(201).json(result.rows[0])
    } catch (e) {
      if (pgUniqueViolation(e)) {
        res.status(400).json({
          error: 'Diese Link-Instanz existiert bereits (gleicher Anker und gleiche Zeilen).',
        })
        return
      }
      throw e
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Link konnte nicht angelegt werden' })
  }
})

// PUT /api/page-links/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  try {
    const cur = await pool.query(
      `SELECT pl.* FROM page_links pl
       JOIN projects p ON p.id = pl.project_id
       WHERE pl.id = $1 AND p.user_id = $2`,
      [id, req.userId]
    )
    const link = cur.rows[0]
    if (!link) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const b = req.body as Record<string, unknown>
    const patches: Record<string, unknown> = {}

    if (bodyFieldPresent(b, 'anchor_text')) {
      patches.anchor_text =
        b.anchor_text == null ? null : String(b.anchor_text).slice(0, 500)
    }
    if (bodyFieldPresent(b, 'context_sentence')) {
      patches.context_sentence = b.context_sentence == null ? null : String(b.context_sentence)
    }
    if (bodyFieldPresent(b, 'placement')) {
      patches.placement =
        b.placement == null ? null : String(b.placement).slice(0, 100)
    }
    if (bodyFieldPresent(b, 'line_number_start')) {
      const v = b.line_number_start
      patches.line_number_start =
        v == null || (typeof v === 'number' && !Number.isFinite(v)) ? null : Math.trunc(v as number)
    }
    if (bodyFieldPresent(b, 'line_number_end')) {
      const v = b.line_number_end
      patches.line_number_end =
        v == null || (typeof v === 'number' && !Number.isFinite(v)) ? null : Math.trunc(v as number)
    }

    if (Object.keys(patches).length === 0) {
      res.status(400).json({ error: 'Keine Felder zum Aktualisieren' })
      return
    }

    const keys = Object.keys(patches)
    const vals = keys.map((k) => patches[k])
    const setSql = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
    const sql = `UPDATE page_links SET ${setSql}, updated_at = NOW() WHERE id = $1 RETURNING *`

    try {
      const result = await pool.query(sql, [id, ...vals])
      res.json(result.rows[0])
    } catch (e) {
      if (pgUniqueViolation(e)) {
        res.status(400).json({
          error: 'Diese Link-Instanz existiert bereits (gleicher Anker und gleiche Zeilen).',
        })
        return
      }
      throw e
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Aktualisierung fehlgeschlagen' })
  }
})

function bodyFieldPresent(b: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(b, key)
}

export default router
