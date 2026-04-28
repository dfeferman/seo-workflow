/**
 * Lädt `.env` aus dem Repository-Root, unabhängig vom aktuellen Arbeitsverzeichnis
 * (z. B. wenn `tsx server/index.ts` mit cwd `server/` gestartet wird).
 */
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(serverDir, '..', '.env')
dotenv.config({ path: envPath })
