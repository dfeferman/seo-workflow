/**
 * Einheitliche Auswertung von Superadmin-Status (API + JSON-Responses).
 * Optional: SUPERADMIN_EMAILS (kommagetrennt) erzwingt Superadmin unabhängig von DB-Flag —
 * sinnvoll, wenn Production-DB und manuelles UPDATE auseinanderlaufen.
 */

let _emailSet: Set<string> | null = null

function superadminEmailSet(): Set<string> {
  if (_emailSet) return _emailSet
  const raw = process.env.SUPERADMIN_EMAILS ?? ''
  _emailSet = new Set(
    raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
  return _emailSet
}

/** Postgres/node-pg liefert meist boolean; defensive gegen null/String. */
export function coercePgBool(v: unknown): boolean {
  if (v === true) return true
  if (v === false || v == null) return false
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') {
    const s = v.toLowerCase()
    return s === 't' || s === 'true' || s === '1' || s === 'yes'
  }
  return false
}

export function effectiveIsSuperadmin(email: string, dbFlag: unknown): boolean {
  const e = email.trim().toLowerCase()
  if (e && superadminEmailSet().has(e)) return true
  return coercePgBool(dbFlag)
}
