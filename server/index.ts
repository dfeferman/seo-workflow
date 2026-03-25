import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import express from 'express'
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

export const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/artifacts', artifactsRouter)
app.use('/api/artifact-results', artifactResultsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/phase-output-templates', phaseOutputTemplatesRouter)
app.use('/api/category-phase-outputs', categoryPhaseOutputsRouter)
app.use('/api/category-reference-docs', categoryReferenceDocsRouter)

if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  app.use(express.static(path.join(__dirname, '../')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'))
  })
}

const PORT = process.env.PORT ?? 3001
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
