import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useArtifacts } from './useArtifacts'
import { useArtifactStatusMap } from './useArtifacts'
import type { ArtifactPhase } from '@/types/database.types'

const PHASE_LABELS: Record<string, { name: string; desc: string }> = {
  A: { name: 'Recherche & SERP', desc: 'Intent, Quellen, FAQ' },
  B: { name: 'Mapping & Links', desc: 'Keywords, Interlinking' },
  C: { name: 'Content-Briefing', desc: 'Outline, FAQ, Links' },
  D: { name: 'Textschreibung', desc: 'Hub-Text, Module' },
  E: { name: 'SEO-Optimierung', desc: 'Review, Anpassungen' },
  F: { name: 'QA & Freigabe', desc: 'YMYL Check, E-E-A-T' },
  G: { name: 'Sonstige', desc: '' },
  X: { name: 'Sonstige', desc: '' },
}

export type PhaseStat = {
  phase: ArtifactPhase
  name: string
  desc: string
  total: number
  done: number
}

export type TimelineItem = {
  artifactId: string
  artifactName: string
  artifactCode: string
  phase: ArtifactPhase
  updatedAt: string
  status: 'draft' | 'final'
}

export type HintItem = {
  type: 'warning' | 'info'
  text: string
}

export type CategoryStats = {
  total: number
  doneCount: number
  activeCount: number
  openCount: number
  progressPercent: number
  byPhase: PhaseStat[]
  recentActivities: TimelineItem[]
  remainingTimeEstimate: string
  hints: HintItem[]
  resultsCount: number
  lastActivityAt: string | null
}

/**
 * Lädt Artefakte + Status, dann letzte Aktivitäten (artifact_results).
 * Berechnet Fortschritt, pro Phase, Timeline, Hinweise und verbleibende Zeit.
 */
export function useStats(categoryId: string | undefined): {
  data: CategoryStats | null
  isLoading: boolean
} {
  const { data: artifacts = [], isLoading: artifactsLoading } = useArtifacts(categoryId)
  const artifactIds = artifacts.map((a) => a.id)
  const { data: statusMap = {}, isLoading: statusLoading } = useArtifactStatusMap(
    categoryId,
    artifactIds
  )

  const { data: recentResults = [] } = useQuery({
    queryKey: ['recent-activity', categoryId, artifactIds],
    queryFn: async (): Promise<{ artifact_id: string; status: 'draft' | 'final'; updated_at: string }[]> => {
      if (artifactIds.length === 0) return []
      const { data, error } = await supabase
        .from('artifact_results')
        .select('artifact_id, status, updated_at')
        .in('artifact_id', artifactIds)
        .order('updated_at', { ascending: false })
        .limit(15)
      if (error) throw error
      return (data ?? []) as { artifact_id: string; status: 'draft' | 'final'; updated_at: string }[]
    },
    enabled: !!categoryId && artifactIds.length > 0,
  })

  const isLoading = artifactsLoading || statusLoading
  if (isLoading || !categoryId) {
    return {
      data: null,
      isLoading,
    }
  }

  const doneCount = artifacts.filter((a) => statusMap[a.id] === 'done').length
  const activeCount = artifacts.filter((a) => statusMap[a.id] === 'active').length
  const openCount = artifacts.filter((a) => statusMap[a.id] === 'open').length
  const total = artifacts.length
  const progressPercent = total ? Math.round((doneCount / total) * 100) : 0

  const byPhaseMap = new Map<string, { total: number; done: number }>()
  const phaseOrder: ArtifactPhase[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X']
  for (const p of phaseOrder) byPhaseMap.set(p, { total: 0, done: 0 })
  for (const a of artifacts) {
    const cur = byPhaseMap.get(a.phase) ?? { total: 0, done: 0 }
    cur.total += 1
    if (statusMap[a.id] === 'done') cur.done += 1
    byPhaseMap.set(a.phase, cur)
  }
  const byPhase: PhaseStat[] = phaseOrder
    .filter((p) => (byPhaseMap.get(p)?.total ?? 0) > 0)
    .map((p) => {
      const v = byPhaseMap.get(p) ?? { total: 0, done: 0 }
      const label = PHASE_LABELS[p] ?? { name: p, desc: '' }
      return {
        phase: p as ArtifactPhase,
        name: label.name,
        desc: label.desc,
        total: v.total,
        done: v.done,
      }
    })

  const artifactById = new Map(artifacts.map((a) => [a.id, a]))
  const recentActivities: TimelineItem[] = recentResults
    .map((r) => {
      const art = artifactById.get(r.artifact_id)
      if (!art) return null
      return {
        artifactId: art.id,
        artifactName: art.name,
        artifactCode: art.artifact_code,
        phase: art.phase,
        updatedAt: r.updated_at,
        status: r.status,
      }
    })
    .filter((x): x is TimelineItem => x != null)

  const DEFAULT_MIN_PER_ARTIFACT = 20
  const openMinutes = openCount * DEFAULT_MIN_PER_ARTIFACT
  const remainingHours = Math.round(openMinutes / 60) || 0
  const remainingTimeEstimate =
    remainingHours > 0 ? `~${remainingHours}h` : openCount > 0 ? '<1h' : '–'

  const resultsCount = recentResults.length
  const lastActivityAt =
    recentActivities.length > 0 ? recentActivities[0].updatedAt : null

  const hints: HintItem[] = []
  const firstActive = artifacts.find((a) => statusMap[a.id] === 'active')
  if (firstActive) {
    hints.push({
      type: 'warning',
      text: `${firstActive.artifact_code} ${firstActive.name} wartet auf Fertigstellung.`,
    })
  }
  const nextPhase = byPhase.find((p) => p.done < p.total && p.total > 0)
  if (nextPhase) {
    const pct = nextPhase.total ? Math.round((nextPhase.done / nextPhase.total) * 100) : 0
    hints.push({
      type: 'info',
      text: `Phase ${nextPhase.phase} ist zu ${pct}% fertig. Nächster Schritt: weitere Artefakte in Phase ${nextPhase.phase} bearbeiten.`,
    })
  }
  if (doneCount === total && total > 0) {
    hints.push({ type: 'info', text: 'Alle Artefakte abgeschlossen.' })
  }

  return {
    data: {
      total,
      doneCount,
      activeCount,
      openCount,
      progressPercent,
      byPhase,
      recentActivities,
      remainingTimeEstimate,
      hints,
      resultsCount,
      lastActivityAt,
    },
    isLoading: false,
  }
}
