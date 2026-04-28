import fs from 'node:fs/promises'
import path from 'node:path'
import type { Pool, PoolClient } from 'pg'
import { dedupeOutgoingLinks } from '../lib/dedupeOutgoingLinks.js'
import { extractMarkdownMetadata } from '../lib/extractMarkdownMetadata.js'
import { normalizeLinkTarget } from '../lib/normalizeLinkTarget.js'

export type MarkdownImportResult = {
  sourcePageId: string
  markdownPathRelative: string
  targetsCreated: number
  linksInserted: number
}

function posixRel(...parts: string[]): string {
  return path.posix.join(...parts)
}

function fallbackNameFromFile(sanitizedFilename: string): string {
  return sanitizedFilename.replace(/\.md$/iu, '').replace(/_/g, ' ')
}

function lastSegmentDisplayName(normalizedSlug: string): string {
  const segments = normalizedSlug.split('/').filter(Boolean)
  const last = segments[segments.length - 1] ?? normalizedSlug
  const decoded = decodeURIComponent(last.replace(/\+/g, ' '))
  return decoded.slice(0, 255)
}

function truncateAnchor(s: string): string {
  if (s.length <= 500) return s
  return s.slice(0, 497) + '...'
}

async function resolveTargetPageId(
  client: PoolClient,
  projectId: string,
  normalizedSlug: string,
  slugToIdCache: Map<string, string>,
  createdTargets: Set<string>
): Promise<string> {
  if (slugToIdCache.has(normalizedSlug)) {
    return slugToIdCache.get(normalizedSlug)!
  }

  const found = await client.query<{ id: string }>(
    `SELECT id FROM pages
     WHERE project_id = $1 AND url_slug IS NOT NULL
       AND lower(trim(url_slug)) = lower(trim($2))`,
    [projectId, normalizedSlug]
  )
  if (found.rows[0]) {
    slugToIdCache.set(normalizedSlug, found.rows[0].id)
    return found.rows[0].id
  }

  const nm = lastSegmentDisplayName(normalizedSlug)
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO pages (project_id, name, type, status, url_slug, word_count)
     VALUES ($1, $2, 'spoke', 'planned', $3, 0)
     RETURNING id`,
    [projectId, nm, normalizedSlug.slice(0, 255)]
  )
  const id = inserted.rows[0].id
  slugToIdCache.set(normalizedSlug, id)
  createdTargets.add(id)
  return id
}

export async function runMarkdownProjectImport(options: {
  pool: Pool
  userId: string
  projectId: string
  markdownBody: string
  sanitizedFilename: string
  uploadRoot: string
}): Promise<MarkdownImportResult> {
  const { pool, userId, projectId, markdownBody, sanitizedFilename, uploadRoot } = options

  const markdownPathRelative = posixRel(projectId, sanitizedFilename)
  const absoluteFile = path.join(uploadRoot, projectId, sanitizedFilename)

  const meta = extractMarkdownMetadata(markdownBody)
  const pageName =
    meta.title ?? fallbackNameFromFile(sanitizedFilename)
  await fs.mkdir(path.dirname(absoluteFile), { recursive: true })
  await fs.writeFile(absoluteFile, markdownBody, 'utf8')

  const client = await pool.connect()
  const slugToIdCache = new Map<string, string>()
  const createdTargets = new Set<string>()

  try {
    await client.query('BEGIN')

    const proj = await client.query(`SELECT id FROM projects WHERE id = $1 AND user_id = $2`, [
      projectId,
      userId,
    ])
    if ((proj.rowCount ?? 0) === 0) {
      throw new Error('Projekt nicht gefunden')
    }

    const existingSource = await client.query<{ id: string }>(
      `SELECT id FROM pages WHERE project_id = $1 AND markdown_file_path = $2`,
      [projectId, markdownPathRelative]
    )

    let sourcePageId: string
    if (existingSource.rows[0]) {
      sourcePageId = existingSource.rows[0].id
      await client.query(
        `UPDATE pages
         SET name = $1, word_count = $2, updated_at = NOW()
         WHERE id = $3`,
        [pageName.slice(0, 255), meta.wordCount, sourcePageId]
      )
    } else {
      const ins = await client.query<{ id: string }>(
        `INSERT INTO pages (project_id, name, type, status, markdown_file_path, word_count)
         VALUES ($1, $2, 'spoke', 'draft', $3, $4)
         RETURNING id`,
        [projectId, pageName.slice(0, 255), markdownPathRelative, meta.wordCount]
      )
      sourcePageId = ins.rows[0].id
    }

    await client.query(`DELETE FROM page_links WHERE from_page_id = $1`, [sourcePageId])

    const unresolved: Array<{ toPageId: string; anchorText: string; lineStart: number }> = []

    for (const link of meta.links) {
      const slug = normalizeLinkTarget(link.url)
      if (!slug) continue
      const toId = await resolveTargetPageId(
        client,
        projectId,
        slug,
        slugToIdCache,
        createdTargets
      )
      if (toId === sourcePageId) continue
      unresolved.push({
        toPageId: toId,
        anchorText: truncateAnchor(link.anchor),
        lineStart: link.line,
      })
    }

    const deduped = dedupeOutgoingLinks(unresolved)
    let linksInserted = 0
    for (const row of deduped) {
      await client.query(
        `INSERT INTO page_links (
           project_id, from_page_id, to_page_id, anchor_text, context_sentence, placement,
           line_number_start, line_number_end
         ) VALUES ($1, $2, $3, $4, NULL, NULL, $5, $6)`,
        [
          projectId,
          sourcePageId,
          row.toPageId,
          row.anchorText,
          row.lineStart,
          row.lineEnd,
        ]
      )
      linksInserted += 1
    }

    await client.query('COMMIT')

    return {
      sourcePageId,
      markdownPathRelative,
      targetsCreated: createdTargets.size,
      linksInserted,
    }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    await fs.unlink(absoluteFile).catch(() => {})
    throw e
  } finally {
    client.release()
  }
}
