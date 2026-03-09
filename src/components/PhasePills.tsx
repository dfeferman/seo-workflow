import type { ArtifactPhase } from '@/types/database.types'
import type { ArtifactStatusMap } from '@/hooks/useArtifacts'
import type { ArtifactRow } from '@/types/database.types'

const PHASE_ORDER: ArtifactPhase[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X']

type PhasePillsProps = {
  artifacts: ArtifactRow[]
  statusMap: ArtifactStatusMap
  activePhase: ArtifactPhase | null
  onPhaseClick?: (phase: ArtifactPhase) => void
}

export function PhasePills({
  artifacts,
  statusMap,
  activePhase,
  onPhaseClick,
}: PhasePillsProps) {
  const byPhase = new Map<ArtifactPhase, { total: number; done: number }>()
  for (const p of PHASE_ORDER) byPhase.set(p, { total: 0, done: 0 })
  for (const a of artifacts) {
    const cur = byPhase.get(a.phase) ?? { total: 0, done: 0 }
    cur.total += 1
    if (statusMap[a.id] === 'done') cur.done += 1
    byPhase.set(a.phase, cur)
  }

  const totalArtifacts = artifacts.length
  const doneCount = artifacts.filter((a) => statusMap[a.id] === 'done').length
  const progressPercent = totalArtifacts ? Math.round((doneCount / totalArtifacts) * 100) : 0

  const phasesToShow = PHASE_ORDER.filter((p) => (byPhase.get(p)?.total ?? 0) > 0)

  const progressBarColor =
    progressPercent >= 100
      ? 'bg-green-500'
      : progressPercent > 50
        ? 'bg-blue-500'
        : progressPercent > 0
          ? 'bg-orange-400'
          : 'bg-slate-200'

  return (
    <div className="flex-shrink-0 bg-white border-b border-slate-100 px-6 pt-5 pb-5 shadow-sm">
      <div className="flex justify-between items-center gap-4 mb-3">
        <div className="flex flex-wrap gap-2">
          {phasesToShow.map((phase) => {
            const { total, done } = byPhase.get(phase) ?? { total: 0, done: 0 }
            const isDone = total > 0 && done === total
            const isActive = activePhase === phase
            return (
              <button
                key={phase}
                type="button"
                onClick={() => onPhaseClick?.(phase)}
                className={`py-2 px-4 rounded-lg text-xs font-semibold font-sans tracking-wide transition-colors ${
                  isDone
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {phase}
              </button>
            )
          })}
        </div>
        <div className="text-sm text-slate-500 font-sans font-medium tabular-nums shrink-0">
          <span className="text-slate-900 font-bold">{doneCount}</span>
          <span className="text-slate-500/80"> / {totalArtifacts}</span>
          <span className="text-slate-500 ml-0.5"> abgeschlossen</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
