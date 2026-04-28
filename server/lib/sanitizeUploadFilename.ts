import path from 'node:path'

const MAX_STEM = 200

export type SanitizeResult =
  | { ok: true; filename: string }
  | { ok: false; error: string }

/**
 * Basisname only (no path traversal), [.md], safe charset for stem.
 */
export function sanitizeUploadFilename(original: string): SanitizeResult {
  const base = path.basename(original.replace(/\\/g, '/'))
  if (!base.toLowerCase().endsWith('.md')) {
    return { ok: false, error: 'Nur .md-Dateien erlaubt' }
  }
  const stem = base.slice(0, -3)
  const safe = stem.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, MAX_STEM)
  if (!safe.length) {
    return { ok: false, error: 'Ungültiger Dateiname' }
  }
  return { ok: true, filename: `${safe}.md` }
}
