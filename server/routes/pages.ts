import { Response, Router } from 'express'
import multer from 'multer'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'
import { runMarkdownProjectImport } from '../services/markdownProjectImport.js'
import { sanitizeUploadFilename } from '../lib/sanitizeUploadFilename.js'

const router = Router()
router.use(requireAuth)

const PAGE_TYPES = new Set(['hub', 'spoke', 'blog'])
const PAGE_STATUSES = new Set(['published', 'draft', 'planned'])

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
}).single('file')

function normalizePageSlug(raw: unknown): string {
  if (raw == null || typeof raw !== 'string') throw new Error('INVALID_SLUG')
  const s = raw.trim()
  if (!s) throw new Error('INVALID_SLUG')
  return s
}

async function projectOwnedByUser(projectId: string, userId: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM projects WHERE id = $1 AND user_id = $2`, [
    projectId,
    userId,
  ])
  return (r.rowCount ?? 0) > 0
}

async function slugTakenByOtherPage(
  projectId: string,
  slugNormalized: string,
  excludePageId: string | null
): Promise<boolean> {
  const r = excludePageId
    ? await pool.query(
        `SELECT 1 FROM pages
         WHERE project_id = $1 AND url_slug IS NOT NULL
           AND lower(trim(url_slug)) = lower(trim($2)) AND id <> $3`,
        [projectId, slugNormalized, excludePageId]
      )
    : await pool.query(
        `SELECT 1 FROM pages
         WHERE project_id = $1 AND url_slug IS NOT NULL
           AND lower(trim(url_slug)) = lower(trim($2))`,
        [projectId, slugNormalized]
      )
  return (r.rowCount ?? 0) > 0
}

async function categoryBelongsToProject(categoryId: string, projectId: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM categories WHERE id = $1 AND project_id = $2`, [
    categoryId,
    projectId,
  ])
  return (r.rowCount ?? 0) > 0
}

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

// POST /api/pages — vor import-markdown und vor GET /:id
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>
    const project_id = body.project_id
    const name = body.name
    const type = body.type
    const url_slug_raw = body.url_slug
    const status = body.status
    const category_id = body.category_id

    if (typeof project_id !== 'string' || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'project_id und name sind erforderlich' })
      return
    }
    if (typeof type !== 'string' || !PAGE_TYPES.has(type)) {
      res.status(400).json({ error: 'type muss hub, spoke oder blog sein' })
      return
    }
    if (typeof status !== 'string' || !PAGE_STATUSES.has(status)) {
      res.status(400).json({ error: 'status muss published, draft oder planned sein' })
      return
    }

    let slug: string
    try {
      slug = normalizePageSlug(url_slug_raw)
    } catch {
      res.status(400).json({ error: 'url_slug ist erforderlich' })
      return
    }

    if (!(await projectOwnedByUser(project_id, req.userId!))) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    let catId: string | null = null
    if (category_id != null && category_id !== '') {
      if (typeof category_id !== 'string') {
        res.status(400).json({ error: 'category_id ungültig' })
        return
      }
      if (!(await categoryBelongsToProject(category_id, project_id))) {
        res.status(400).json({ error: 'Kategorie gehört nicht zu diesem Projekt' })
        return
      }
      catId = category_id
    }

    if (await slugTakenByOtherPage(project_id, slug, null)) {
      res.status(400).json({ error: 'URL-Slug ist im Projekt bereits vergeben' })
      return
    }

    const result = await pool.query(
      `INSERT INTO pages (project_id, category_id, name, type, status, url_slug, word_count)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       RETURNING *`,
      [project_id, catId, name.trim().slice(0, 255), type, status, slug.slice(0, 255)]
    )
    res.status(201).json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Seite konnte nicht angelegt werden' })
  }
})

// PUT /api/pages/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = routeParamOne(req.params.id)
  if (!(await pageBelongsToUser(id, req.userId!))) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const cur = await pool.query(`SELECT * FROM pages WHERE id = $1`, [id])
  const row = cur.rows[0] as Record<string, unknown> | undefined
  if (!row) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const projectId = row.project_id as string

  const body = req.body as Record<string, unknown>
  const patches: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      res.status(400).json({ error: 'name ungültig' })
      return
    }
    patches.name = body.name.trim().slice(0, 255)
  }
  if (body.type !== undefined) {
    if (typeof body.type !== 'string' || !PAGE_TYPES.has(body.type)) {
      res.status(400).json({ error: 'type ungültig' })
      return
    }
    patches.type = body.type
  }
  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !PAGE_STATUSES.has(body.status)) {
      res.status(400).json({ error: 'status ungültig' })
      return
    }
    patches.status = body.status
  }
  if (body.url_slug !== undefined) {
    let slug: string
    try {
      slug = normalizePageSlug(body.url_slug)
    } catch {
      res.status(400).json({ error: 'url_slug ungültig' })
      return
    }
    if (await slugTakenByOtherPage(projectId, slug, id)) {
      res.status(400).json({ error: 'URL-Slug ist im Projekt bereits vergeben' })
      return
    }
    patches.url_slug = slug.slice(0, 255)
  }
  if (body.category_id !== undefined) {
    if (body.category_id === null || body.category_id === '') {
      patches.category_id = null
    } else if (typeof body.category_id === 'string') {
      if (!(await categoryBelongsToProject(body.category_id, projectId))) {
        res.status(400).json({ error: 'Kategorie gehört nicht zu diesem Projekt' })
        return
      }
      patches.category_id = body.category_id
    } else {
      res.status(400).json({ error: 'category_id ungültig' })
      return
    }
  }
  if (body.markdown_file_path !== undefined) {
    const v = body.markdown_file_path
    if (v === null || v === '') {
      /* SP23: keine bewusste Löschung über API */
    } else if (typeof v === 'string') {
      patches.markdown_file_path = v
    }
  }
  if (body.word_count !== undefined && typeof body.word_count === 'number') {
    patches.word_count = body.word_count
  }

  if (Object.keys(patches).length === 0) {
    res.status(400).json({ error: 'Keine Felder zum Aktualisieren' })
    return
  }

  const keys = Object.keys(patches)
  const vals = keys.map((k) => patches[k])
  const setSql = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
  const sql = `UPDATE pages SET ${setSql}, updated_at = NOW() WHERE id = $1 RETURNING *`

  try {
    const result = await pool.query(sql, [id, ...vals])
    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Aktualisierung fehlgeschlagen' })
  }
})

// POST /api/pages/import-markdown/:projectId — vor GET /:id registrieren
router.post(
  '/import-markdown/:projectId',
  (req: AuthRequest, res, next) => {
    uploadSingle(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Datei zu groß (max. 5 MB)' })
        return
      }
      if (err) {
        console.error(err)
        res.status(400).json({ error: 'Upload fehlgeschlagen' })
        return
      }
      next()
    })
  },
  async (req: AuthRequest, res: Response) => {
    const projectId = routeParamOne(req.params.projectId)
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file
    if (!file?.buffer?.length) {
      res.status(400).json({ error: 'Datei fehlt (Feld "file")' })
      return
    }
    const sanitized = sanitizeUploadFilename(file.originalname)
    if (!sanitized.ok) {
      res.status(400).json({ error: sanitized.error })
      return
    }
    const uploadRoot = process.env.UPLOAD_ROOT?.trim()
    if (!uploadRoot) {
      res.status(500).json({ error: 'UPLOAD_ROOT nicht konfiguriert' })
      return
    }
    const body = file.buffer.toString('utf8')
    try {
      const result = await runMarkdownProjectImport({
        pool,
        userId: req.userId!,
        projectId,
        markdownBody: body,
        sanitizedFilename: sanitized.filename,
        uploadRoot,
      })
      res.status(200).json(result)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Import fehlgeschlagen'
      if (msg === 'Projekt nicht gefunden') {
        res.status(404).json({ error: msg })
        return
      }
      console.error(e)
      res.status(500).json({ error: msg })
    }
  }
)

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
