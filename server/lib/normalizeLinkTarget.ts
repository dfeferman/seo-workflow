import path from 'node:path'

/** null = skip (mailto, #-only, empty path, invalid) */
export function normalizeLinkTarget(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  const lower = t.toLowerCase()
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return null
  if (t.startsWith('#')) return null

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      const u = new URL(t)
      const p = u.pathname
      if (!p || p === '/') return null
      return stripLeadingSlash(path.posix.normalize(p))
    } catch {
      return null
    }
  }

  const prefixed = t.startsWith('/') ? t : `/${t.replace(/^\.\//, '')}`
  const n = path.posix.normalize(prefixed)
  if (n === '/' || n === '.' || n === '') return null
  return stripLeadingSlash(n)
}

function stripLeadingSlash(s: string): string {
  return s.replace(/^\/+/u, '')
}
