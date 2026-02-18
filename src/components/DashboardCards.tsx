import { Link } from '@tanstack/react-router'
import type { CategoryRow } from '@/types/database.types'
import type { CategoryStats, PhaseStat, TimelineItem, HintItem } from '@/hooks/useStats'

const PHASE_BADGE_CLASS: Record<string, string> = {
  A: 'bg-[#f3e8ff] text-[#7c3aed]',
  B: 'bg-[#dbeafe] text-[#2563eb]',
  C: 'bg-[#fef3c7] text-[#d97706]',
  D: 'bg-[#d1fae5] text-[#059669]',
  E: 'bg-[#fee2e2] text-[#dc2626]',
  F: 'bg-[#f3f4f6] text-[#6b7280]',
  G: 'bg-[#f3f4f6] text-[#6b7280]',
  X: 'bg-[#f3f4f6] text-[#6b7280]',
}

function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    if (dDate.getTime() === today.getTime()) return `Heute, ${time}`
    if (dDate.getTime() === yesterday.getTime()) return `Gestern, ${time}`
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

type DashboardCardsProps = {
  category: CategoryRow | null
  stats: CategoryStats | null
  projectId: string
  categoryId: string
  isLoading?: boolean
}

export function DashboardCards({
  category,
  stats,
  projectId,
  categoryId,
  isLoading,
}: DashboardCardsProps) {
  if (isLoading || !category) {
    return (
      <div className="p-7 flex items-center justify-center min-h-[200px] text-muted text-sm">
        Statistiken laden…
      </div>
    )
  }

  const title = category.hub_name || category.name
  const meta: string[] = []
  if (category.zielgruppen?.length) meta.push(`🎯 ${category.zielgruppen.join(' · ')}`)
  if (category.shop_typ) meta.push(`🏪 ${category.shop_typ}`)

  return (
    <div className="p-7 space-y-6">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text tracking-tight mb-2">{title}</h1>
          {meta.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {meta.map((m, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-2xs font-medium bg-surface2 border border-border text-muted"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-muted max-w-xl leading-relaxed">
            {stats
              ? `${stats.doneCount}/${stats.total} Artefakte abgeschlossen. ${stats.activeCount} in Arbeit, ${stats.openCount} offen.`
              : 'Keine Artefakte in dieser Kategorie.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 flex-shrink-0">
          <div className="bg-accent-light/50 border border-accent/20 rounded-xl px-6 py-5 text-center min-w-[180px]">
            <div className="text-4xl font-bold text-accent">{stats?.progressPercent ?? 0}%</div>
            <div className="text-2xs text-muted font-medium uppercase tracking-wide mt-1">
              Fortschritt
            </div>
          </div>
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            className="py-2.5 px-4 rounded-lg bg-accent text-white text-sm font-semibold text-center hover:bg-[#4a6fef] transition-colors"
          >
            → Zum Workflow
          </Link>
        </div>
      </div>

      {/* 4 Mini-Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface2 border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text">{stats.doneCount}</div>
            <div className="text-2xs text-muted mt-1">Artefakte fertig</div>
          </div>
          <div className="bg-surface2 border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text">{stats.activeCount}</div>
            <div className="text-2xs text-muted mt-1">In Arbeit</div>
          </div>
          <div className="bg-surface2 border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text">{stats.openCount}</div>
            <div className="text-2xs text-muted mt-1">Noch offen</div>
          </div>
          <div className="bg-surface2 border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text">{stats.remainingTimeEstimate}</div>
            <div className="text-2xs text-muted mt-1">Verbleibend</div>
          </div>
        </div>
      )}

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {stats && (
          <>
            <PhaseProgressCard byPhase={stats.byPhase} projectId={projectId} categoryId={categoryId} />
            <TimelineCard activities={stats.recentActivities} />
            <HintsCard hints={stats.hints} />
            <QuickStatsCard stats={stats} />
          </>
        )}
      </div>
    </div>
  )
}

function PhaseProgressCard({
  byPhase,
  projectId,
  categoryId,
}: {
  byPhase: PhaseStat[]
  projectId: string
  categoryId: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <span>📊</span> Fortschritt pro Phase
        </h2>
        <Link
          to="/projects/$projectId/categories/$categoryId"
          params={{ projectId, categoryId }}
          className="text-xs font-medium text-accent hover:underline"
        >
          Details →
        </Link>
      </div>
      <div className="space-y-3">
        {byPhase.map((p) => (
          <div key={p.phase} className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold font-mono flex-shrink-0 ${PHASE_BADGE_CLASS[p.phase] ?? PHASE_BADGE_CLASS.F}`}
            >
              {p.phase}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text">{p.name}</div>
              {p.desc && <div className="text-2xs text-muted">{p.desc}</div>}
            </div>
            <div className="flex flex-col gap-1 items-end min-w-[72px]">
              <div className="text-2xs font-mono text-muted">
                <span className="text-accent font-semibold">{p.done}</span> / {p.total}
              </div>
              <div className="w-full h-1 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: p.total ? `${(p.done / p.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineCard({ activities }: { activities: TimelineItem[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <span>🕐</span> Letzte Aktivitäten
        </h2>
      </div>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-muted py-2">Noch keine Aktivitäten.</p>
        ) : (
          activities.slice(0, 8).map((a, i) => (
            <div key={`${a.artifactId}-${a.updatedAt}-${i}`} className="flex gap-3 items-start">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  a.status === 'final' ? 'bg-green' : 'bg-yellow'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-text">{a.artifactCode} {a.artifactName}</div>
                <div className="text-2xs text-muted font-mono">
                  {formatRelativeDate(a.updatedAt)} · Phase {a.phase}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function HintsCard({ hints }: { hints: HintItem[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
        <span>⚠️</span> Hinweise & Nächste Schritte
      </h2>
      <div className="space-y-2.5">
        {hints.length === 0 ? (
          <p className="text-sm text-muted py-1">Alles erledigt – keine offenen Hinweise.</p>
        ) : (
          hints.map((h, i) => (
            <div
              key={i}
              className={`flex gap-2.5 p-3 rounded-lg text-sm ${
                h.type === 'warning'
                  ? 'bg-yellow/10 border border-yellow/20 text-yellow'
                  : 'bg-accent-light/50 border border-accent/20 text-text-secondary'
              }`}
            >
              <span>{h.type === 'warning' ? '⏳' : '💡'}</span>
              <span className="leading-snug">{h.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function QuickStatsCard({ stats }: { stats: CategoryStats }) {
  const lastActivityStr = stats.lastActivityAt
    ? formatRelativeDate(stats.lastActivityAt)
    : '–'
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
        <span>📈</span> Schnellstatistik
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">Ergebnisse gespeichert</span>
          <span className="text-sm font-semibold text-text">{stats.resultsCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">Artefakte fertig</span>
          <span className="text-sm font-semibold text-text">{stats.doneCount} / {stats.total}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">Verbleibend (Schätzung)</span>
          <span className="text-sm font-semibold text-text">{stats.remainingTimeEstimate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">Letzte Bearbeitung</span>
          <span className="text-2xs font-mono font-medium text-text">{lastActivityStr}</span>
        </div>
      </div>
    </div>
  )
}
