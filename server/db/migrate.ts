/**
 * Auto-Migration Runner
 *
 * Läuft beim App-Start (vor dem ersten Request).
 * Liest alle *.sql-Dateien aus server/db/migrations/ in alphabetischer Reihenfolge
 * und führt jede genau einmal aus — verfolgt via schema_migrations-Tabelle.
 *
 * Sicher bei Mehrfachausführung: bereits angewendete Migrationen werden übersprungen.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `)
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ name: string }>(`SELECT name FROM schema_migrations`)
  return new Set(result.rows.map((r) => r.name))
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable()
  const applied = await getAppliedMigrations()

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort() // alphabetisch = chronologisch (001_, 002_, ...)

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip  ${file}`)
      continue
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query(`INSERT INTO schema_migrations (name) VALUES ($1)`, [file])
      await client.query('COMMIT')
      console.log(`[migrate] apply ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`[migrate] FAILED ${file}:`, err)
      throw err // App-Start abbrechen — DB-Zustand unbekannt
    } finally {
      client.release()
    }
  }
}
