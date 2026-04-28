import type { PageLinkRow, PageRow, PageStatus, PageType } from '@/types/database.types'

export type LinkGraphTypeFilter = PageType
export type LinkGraphStatusFilter = PageStatus

export const PHASE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X'] as const
export type LinkGraphPhaseToken = (typeof PHASE_OPTIONS)[number]

export interface LinkGraphFilters {
  /** Leer = alle Typen; sonst nur diese (Whitelist). */
  types: LinkGraphTypeFilter[]
  /** Leer = alle Status. */
  statuses: LinkGraphStatusFilter[]
  /** Leer = kein Phasenfilter; sonst Seite nur wenn category_id und Schnitt mit Artefakt-Phasen. */
  phases: string[]
  orphansOnly: boolean
  deadEndsOnly: boolean
}

export function defaultLinkGraphFilters(): LinkGraphFilters {
  return {
    types: [],
    statuses: [],
    phases: [],
    orphansOnly: false,
    deadEndsOnly: false,
  }
}

const ALL_TYPES: LinkGraphTypeFilter[] = ['hub', 'spoke', 'blog']
const ALL_STATUSES: LinkGraphStatusFilter[] = ['published', 'draft', 'planned']

/** Leeres `types` = alle. Checkbox-Logik: von „alle“ ein Typ ausblenden oder Whitelist umschalten. */
export function toggleTypeFilter(filters: LinkGraphFilters, t: LinkGraphTypeFilter): LinkGraphFilters {
  if (filters.types.length === 0) {
    return { ...filters, types: ALL_TYPES.filter((x) => x !== t) }
  }
  const next = filters.types.includes(t)
    ? filters.types.filter((x) => x !== t)
    : [...filters.types, t]
  if (next.length === 0 || next.length === ALL_TYPES.length) {
    return { ...filters, types: [] }
  }
  return { ...filters, types: next }
}

export function toggleStatusFilter(filters: LinkGraphFilters, s: LinkGraphStatusFilter): LinkGraphFilters {
  if (filters.statuses.length === 0) {
    return { ...filters, statuses: ALL_STATUSES.filter((x) => x !== s) }
  }
  const next = filters.statuses.includes(s)
    ? filters.statuses.filter((x) => x !== s)
    : [...filters.statuses, s]
  if (next.length === 0 || next.length === ALL_STATUSES.length) {
    return { ...filters, statuses: [] }
  }
  return { ...filters, statuses: next }
}

function toggleList(arr: string[], value: string): string[] {
  if (arr.includes(value)) return arr.filter((x) => x !== value)
  return [...arr, value]
}

export function togglePhaseFilter(filters: LinkGraphFilters, phase: string): LinkGraphFilters {
  const p = phase.toUpperCase().slice(0, 1)
  return { ...filters, phases: toggleList(filters.phases, p) }
}

/** Filtert Seiten; Kanten werden separat auf sichtbare Endpunkte begrenzt. */
export function filterPagesForGraph(
  pages: PageRow[],
  pageLinks: PageLinkRow[],
  filters: LinkGraphFilters,
  categoryPhases: Map<string, Set<string>>
): PageRow[] {
  const incoming = new Map<string, number>()
  const outgoing = new Map<string, number>()
  for (const l of pageLinks) {
    incoming.set(l.to_page_id, (incoming.get(l.to_page_id) ?? 0) + 1)
    outgoing.set(l.from_page_id, (outgoing.get(l.from_page_id) ?? 0) + 1)
  }

  return pages.filter((p) => {
    if (filters.types.length > 0 && !filters.types.includes(p.type)) return false
    if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false

    if (filters.phases.length > 0) {
      if (!p.category_id) return false
      const phases = categoryPhases.get(p.category_id)
      if (!phases || !filters.phases.some((ph) => phases.has(ph))) return false
    }

    const inc = incoming.get(p.id) ?? 0
    const out = outgoing.get(p.id) ?? 0
    if (filters.orphansOnly && inc > 0) return false
    if (filters.deadEndsOnly && out > 0) return false

    return true
  })
}
