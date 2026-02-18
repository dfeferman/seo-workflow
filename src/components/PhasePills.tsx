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

  return (
    <div className="flex-shrink-0 bg-surface px-7 pt-4">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex gap-1.5">
          {phasesToShow.map((phase) => {
            const { total, done } = byPhase.get(phase) ?? { total: 0, done: 0 }
            const isDone = total > 0 && done === total
            const isActive = activePhase === phase
            return (
              <button
                key={phase}
                type="button"
                onClick={() => onPhaseClick?.(phase)}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold font-mono transition-all border ${
                  isDone
                    ? 'bg-green/10 text-green border-transparent'
                    : isActive
                      ? 'bg-accent-light text-accent border-accent'
                      : 'bg-surface-2 text-muted border-transparent hover:border-border hover:text-text-secondary'
                }`}
              >
                {phase}
              </button>
            )
          })}
        </div>
        <div className="text-sm text-muted font-mono font-medium">
          <span className="text-accent font-semibold">{doneCount}</span> / {totalArtifacts} abgeschlossen
        </div>
      </div>
      <div className="h-1 bg-surface-2 rounded border border-border overflow-hidden mb-5">
        <div
          className="h-full rounded bg-gradient-to-r from-accent to-[#7c3aed] transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
