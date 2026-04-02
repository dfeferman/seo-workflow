import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import authRouter from './routes/auth.js'
import projectsRouter from './routes/projects.js'
import categoriesRouter from './routes/categories.js'
import artifactsRouter from './routes/artifacts.js'
import artifactResultsRouter from './routes/artifactResults.js'
import templatesRouter from './routes/templates.js'
import phaseOutputTemplatesRouter from './routes/phaseOutputTemplates.js'
import categoryPhaseOutputsRouter from './routes/categoryPhaseOutputs.js'
import categoryReferenceDocsRouter from './routes/categoryReferenceDocs.js'
import adminUsersRouter from './routes/adminUsers.js'

export const app = express()
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
// Unsigned cookies: refresh tokens are validated via SHA-256 hash lookup in DB, not cookie signing
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/artifacts', artifactsRouter)
app.use('/api/artifact-results', artifactResultsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/phase-output-templates', phaseOutputTemplatesRouter)
app.use('/api/category-phase-outputs', categoryPhaseOutputsRouter)
app.use('/api/category-reference-docs', categoryReferenceDocsRouter)
app.use('/api/admin', adminUsersRouter)

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  app.use(express.static(path.join(__dirname, '../')))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
  })
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

/** Default 3003 — vermeidet Kollision mit Velacare/Next (`next dev -p 3001`). Überschreibbar via PORT in .env */
const PORT = process.env.PORT ?? 3003
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.JWT_SECRET?.trim()) {
    console.error(
      'FATAL: JWT_SECRET fehlt oder ist leer. Ohne JWT_SECRET schlagen Login und Registrierung mit 500 fehl.\n' +
        'Lege in .env JWT_SECRET an (siehe .env.example, mindestens eine sichere Zeichenkette).'
    )
    process.exit(1)
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
