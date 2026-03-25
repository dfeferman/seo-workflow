import express from 'express'
import 'dotenv/config'
import authRouter from './routes/auth.js'

export const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)

const PORT = process.env.PORT ?? 3001
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
