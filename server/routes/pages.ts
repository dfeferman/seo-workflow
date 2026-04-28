import { Response, Router } from 'express'
import multer from 'multer'
import { pool } from '../db.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { routeParamOne } from './routeParams.js'
import { runMarkdownProjectImport } from '../services/markdownProjectImport.js'
import { sanitizeUploadFilename } from '../lib/sanitizeUploadFilename.js'

const router = Router()
router.use(requireAuth)

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
}).single('file')

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
