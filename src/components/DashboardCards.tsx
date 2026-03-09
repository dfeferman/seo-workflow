import { Link } from '@tanstack/react-router'
import type { CategoryRow } from '@/types/database.types'
import type { CategoryStats, TimelineItem, HintItem } from '@/hooks/useStats'

const PHASE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  A: { bg: 'bg-[#f3e8ff]', text: 'text-[#7c3aed]', bar: 'bg-[#7c3aed]' },
  B: { bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]', bar: 'bg-[#2563eb]' },
  C: { bg: 'bg-[#fef3c7]', text: 'text-[#d97706]', bar: 'bg-[#d97706]' },
  D: { bg: 'bg-[#d1fae5]', text: 'text-[#059669]', bar: 'bg-[#059669]' },
  E: { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', bar: 'bg-[#dc2626]' },
  F: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', bar: 'bg-[#6b7280]' },
  G: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', bar: 'bg-[#6b7280]' },
  X: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', bar: 'bg-[#6b7280]' },
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

/** SVG Kreisring für Fortschrittsanzeige */
function ProgressRing({ percent }: { percent: number }) {
  const r = 45
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(percent, 100) / 100)
  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke="#0f172a"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-2xl font-semibold text-slate-900 leading-none">{percent}%</span>
        <span className="font-mono text-xs tracking-widest uppercase text-slate-500 mt-0.5">Fortschritt</span>
      </div>
    </div>
  )
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
      <div className="p-7 flex items-center justify-center min-h-[200px] text-slate-500 text-sm">
        Statistiken laden…
      </div>
    )
  }

  const title = category.hub_name || category.name
  const badges: string[] = []
  if (category.zielgruppen?.length) category.zielgruppen.forEach(z => badges.push(`🎯 ${z}`))
  if (category.shop_typ) badges.push(`🏪 ${category.shop_typ}`)

  const kpis = [
    {
      value: String(stats?.doneCount ?? 0),
      label: 'Artefakte fertig',
      color: 'text-emerald-700',
      sub: `von ${stats?.total ?? 0} gesamt`,
      dot: 'bg-emerald-500',
    },
    {
      value: String(stats?.activeCount ?? 0),
      label: 'In Arbeit',
      color: 'text-amber-800',
      sub: 'Artefakte aktiv',
      dot: 'bg-amber-500',
    },
    {
      value: String(stats?.openCount ?? 0),
      label: 'Noch offen',
      color: 'text-slate-900',
      sub: 'verbleibend',
      dot: 'bg-[#a0aec0]',
    },
    {
      value: stats?.remainingTimeEstimate ?? '–',
      label: 'Verbleibend',
      color: 'text-slate-900',
      sub: 'Schätzung',
      dot: null,
    },
  ]

  return (
    <div className="p-6 pb-10 space-y-6 max-w-[1100px]">

      {/* ── Hero ── */}
      <div className="flex items-center gap-6 bg-white border border-slate-100 rounded-xl px-7 py-6 relative overflow-hidden hover:border-slate-200 hover:shadow-sm transition-all">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-500 rounded-l-xl" />
        <div className="flex-1 min-w-0 pl-4">
          <div className="font-mono text-xs tracking-[.12em] uppercase text-slate-500 mb-2">
            {category.type === 'category' ? 'Kategorie · Hub-Seite' : 'Blog-Artikel'}
          </div>
          <h1 className="font-sans text-4xl font-semibold text-slate-900 leading-tight mb-3 tracking-tight">
            {title}
          </h1>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {badges.map((b, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                  {b}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
            {stats
              ? `${stats.doneCount}/${stats.total} Artefakte abgeschlossen. ${stats.activeCount} in Arbeit, ${stats.openCount} offen.`
              : 'Keine Artefakte in dieser Kategorie.'}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <ProgressRing percent={stats?.progressPercent ?? 0} />
          <Link
            to="/projects/$projectId/categories/$categoryId"
            params={{ projectId, categoryId }}
            search={{ open: undefined }}
            className="py-2 px-5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm whitespace-nowrap"
          >
            → Weiter zum Workflow
          </Link>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(({ value, label, color, sub, dot }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-[#c9cdd4] transition-all">
            <div className={`font-sans text-4xl font-semibold leading-none mb-1.5 ${color}`}>{value}</div>
            <div className="font-mono text-xs tracking-[.08em] uppercase text-slate-500">{label}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
              <span className="text-xs text-slate-500">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Phase Pipeline ── */}
      {stats && stats.byPhase.length > 0 && (
        <div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-sm font-semibold text-slate-900 tracking-tight">Workflow-Phasen</span>
            <div className="flex-1 h-px bg-border" />
            <Link
              to="/projects/$projectId/categories/$categoryId"
              params={{ projectId, categoryId }}
              search={{ open: undefined }}
              className="text-xs text-slate-600 font-medium hover:text-slate-900 hover:underline whitespace-nowrap"
            >
              Alle öffnen →
            </Link>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {stats.byPhase.map((p, idx) => {
              const colors = PHASE_COLORS[p.phase] ?? PHASE_COLORS.F
              const fillPct = p.total ? Math.round((p.done / p.total) * 100) : 0
              const isDone = p.done === p.total && p.total > 0
              const isActive = !isDone && p.done > 0
              return (
                <div
                  key={p.phase}
                  className={`flex-1 px-3 py-4 flex flex-col gap-2 relative transition-colors
                    ${idx < stats.byPhase.length - 1 ? 'border-r border-slate-200' : ''}
                    ${isActive ? 'bg-slate-50' : isDone ? 'bg-emerald-50/50' : ''}
                  `}
                >
                  {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400 rounded-b" />}
                  {isDone && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-b" />}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono ${colors.bg} ${colors.text}`}>
                      {p.phase}
                    </span>
                    <span className={`font-mono text-xs font-medium ${isDone ? 'text-green-600' : isActive ? 'text-orange-500' : 'text-slate-500'}`}>
                      {isDone ? '✓' : isActive ? '●' : '–'}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 leading-snug">{p.name}</div>
                    {p.desc && <div className="text-xs text-slate-500 leading-snug mt-0.5">{p.desc}</div>}
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-slate-500 whitespace-nowrap">{p.done}/{p.total}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Bento Grid ── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Reihe 1: Aktivitäten (2 cols) + Nächste Schritte (1 col) */}
          <div className="lg:col-span-2">
            <TimelineCard activities={stats.recentActivities} />
          </div>
          <div>
            <HintsCard hints={stats.hints} />
          </div>
          {/* Reihe 2: Metadaten (2 cols) + Statistik (1 col) */}
          <div className="lg:col-span-2">
            <MetadatenCard category={category} projectId={projectId} categoryId={categoryId} />
          </div>
          <div>
            <QuickStatsCard stats={stats} />
          </div>
        </div>
      )}
    </div>
  )
}

function TimelineCard({ activities }: { activities: TimelineItem[] }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 h-full hover:border-slate-200 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm">🕐</div>
          <h2 className="text-sm font-semibold text-slate-900">Letzte Aktivitäten</h2>
        </div>
      </div>
      <div className="divide-y divide-border">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Noch keine Aktivitäten.</p>
        ) : (
          activities.slice(0, 8).map((a, i) => (
            <div key={`${a.artifactId}-${a.updatedAt}-${i}`} className="flex gap-3 items-start py-2.5 first:pt-0 last:pb-0">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${a.status === 'final' ? 'bg-green' : 'bg-yellow'}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900">{a.artifactCode} {a.artifactName}</div>
                <div className="font-mono text-xs text-slate-500 mt-0.5">{formatRelativeDate(a.updatedAt)} · Phase {a.phase}</div>
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
    <div className="bg-white border border-slate-100 rounded-xl p-5 h-full hover:border-slate-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm">⚡</div>
        <h2 className="text-sm font-semibold text-slate-900">Nächste Schritte</h2>
      </div>
      <div className="flex flex-col gap-2">
        {hints.length === 0 ? (
          <p className="text-sm text-slate-500 py-1">Alles erledigt – keine offenen Hinweise.</p>
        ) : (
          hints.map((h, i) => (
            <div
              key={i}
              className={`flex gap-2.5 p-3 rounded-lg text-sm ${
                h.type === 'warning'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-slate-50 border border-slate-200 text-slate-600'
              }`}
            >
              <span className="flex-shrink-0">{h.type === 'warning' ? '⏳' : '💡'}</span>
              <span className="leading-snug text-xs">{h.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MetadatenCard({ category, projectId, categoryId }: { category: CategoryRow; projectId: string; categoryId: string }) {
  const rows = [
    { label: 'Shop-Typ', value: category.shop_typ || '–' },
    { label: 'Tonalität', value: category.ton || '–' },
    { label: 'No-Gos', value: category.no_gos ? 'definiert' : '–', highlight: !!category.no_gos },
    { label: 'USPs', value: category.usps || '–' },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full hover:border-[#c9cdd4] transition-all">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm">✎</div>
          <h2 className="text-sm font-semibold text-slate-900">Metadaten</h2>
        </div>
        <Link
          to="/projects/$projectId/categories/$categoryId/settings"
          params={{ projectId, categoryId }}
          className="text-xs text-slate-600 font-medium hover:text-slate-900 hover:underline"
        >
          Bearbeiten →
        </Link>
      </div>
      <div className="divide-y divide-border">
        {rows.map(({ label, value, highlight }) => (
          <div key={label} className="flex justify-between items-start gap-4 py-2 first:pt-0 last:pb-0">
            <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
            <span className={`text-xs font-medium text-right leading-snug ${highlight ? 'text-red-600' : 'text-slate-900'}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickStatsCard({ stats }: { stats: CategoryStats }) {
  const lastActivityStr = stats.lastActivityAt ? formatRelativeDate(stats.lastActivityAt) : '–'
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 h-full hover:border-slate-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm">📈</div>
        <h2 className="text-sm font-semibold text-slate-900">Statistik</h2>
      </div>
      <div className="divide-y divide-border">
        {[
          { label: 'Ergebnisse gespeichert', value: String(stats.resultsCount) },
          { label: 'Artefakte fertig', value: `${stats.doneCount} / ${stats.total}` },
          { label: 'Verbleibend', value: stats.remainingTimeEstimate },
          { label: 'Letzte Bearbeitung', value: lastActivityStr },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-semibold text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
