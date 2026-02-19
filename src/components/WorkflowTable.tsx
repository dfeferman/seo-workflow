import type { ArtifactRow } from '@/types/database.types'
import type { ArtifactStatus, ArtifactStatusMap } from '@/hooks/useArtifacts'
import { EmptyState } from '@/components/EmptyState'

const PHASE_BADGE: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: 'bg-[#f3e8ff]', text: 'text-[#7c3aed]', ring: 'ring-[#7c3aed]/20' },
  B: { bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]', ring: 'ring-[#2563eb]/20' },
  C: { bg: 'bg-[#fef3c7]', text: 'text-[#d97706]', ring: 'ring-[#d97706]/20' },
  D: { bg: 'bg-[#d1fae5]', text: 'text-[#059669]', ring: 'ring-[#059669]/20' },
  E: { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', ring: 'ring-[#dc2626]/20' },
  F: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', ring: 'ring-[#6b7280]/20' },
  G: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', ring: 'ring-[#6b7280]/20' },
  X: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', ring: 'ring-[#6b7280]/20' },
}

function statusLabel(s: ArtifactStatus): string {
  switch (s) {
    case 'done':   return 'Abgeschlossen'
    case 'active': return 'In Arbeit'
    default:       return 'Offen'
  }
}

function StatusDot({ status }: { status: ArtifactStatus }) {
  const dotClass =
    status === 'done'
      ? 'bg-green'
      : status === 'active'
        ? 'bg-yellow animate-pulse'
        : 'bg-[#a0aec0]'
  const textClass =
    status === 'done'     ? 'text-green'
    : status === 'active' ? 'text-yellow'
    : 'text-muted'
  return (
    <div className={`inline-flex items-center gap-1.5 font-sans text-xs font-semibold tracking-wide ${textClass}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
      {statusLabel(status)}
    </div>
  )
}

type WorkflowTableProps = {
  artifacts: ArtifactRow[]
  statusMap: ArtifactStatusMap
  selectedArtifactId: string | null
  onSelectArtifact: (artifact: ArtifactRow) => void
  onCopyPrompt: (artifact: ArtifactRow) => void
  onCopyResult: (artifact: ArtifactRow) => void
  onDeleteArtifact?: (artifact: ArtifactRow) => void
}

export function WorkflowTable({
  artifacts,
  statusMap,
  selectedArtifactId,
  onSelectArtifact,
  onCopyPrompt,
  onCopyResult,
  onDeleteArtifact,
}: WorkflowTableProps) {
  if (artifacts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface/80 backdrop-blur-[2px] min-h-[320px]">
        <EmptyState
          icon="📋"
          title="Keine Artefakte"
          description="Artefakte anlegen oder aus einer Vorlage übernehmen."
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface/80 backdrop-blur-[2px] min-h-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-border sticky top-0 bg-surface/95 backdrop-blur-sm z-10 shadow-[0_1px_0_0_var(--border)]">
            <th className="text-left py-4 px-6 w-[72px] font-sans text-[11px] tracking-widest uppercase text-muted font-semibold">
              Phase
            </th>
            <th className="text-left py-4 px-6 font-sans text-[11px] tracking-widest uppercase text-muted font-semibold">
              Artefakt
            </th>
            <th className="text-left py-4 px-6 w-[140px] font-sans text-[11px] tracking-widest uppercase text-muted font-semibold">
              Status
            </th>
            <th className="text-left py-4 px-6 w-[240px] font-sans text-[11px] tracking-widest uppercase text-muted font-semibold">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody>
          {artifacts.map((artifact, index) => {
            const status = statusMap[artifact.id] ?? 'open'
            const colors = PHASE_BADGE[artifact.phase] ?? PHASE_BADGE.F
            const isSelected = selectedArtifactId === artifact.id
            const hasResult = status !== 'open'
            return (
              <tr
                key={artifact.id}
                onClick={() => onSelectArtifact(artifact)}
                className={`border-b border-border/80 transition-[transform,background-color,box-shadow,border-color] duration-200 cursor-pointer group ${
                  isSelected
                    ? 'bg-accent-light/40 border-l-4 border-l-accent shadow-[2px_0_0_0_var(--accent)]'
                    : 'hover:bg-surface-2/80 border-l-4 border-l-transparent hover:shadow-sm'
                }`}
                style={{
                  animation: 'artifactRowIn 0.35s ease-out both',
                  animationDelay: `${Math.min(index * 40, 400)}ms`,
                }}
              >
                {/* Phase Badge */}
                <td className="py-4 px-6 align-middle">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold font-sans ring-2 ${colors.bg} ${colors.text} ${colors.ring}`}
                  >
                    {artifact.phase}
                  </span>
                </td>

                {/* Name + Description */}
                <td className="py-4 px-6 align-middle">
                  <div className="font-sans text-text text-xs leading-snug tracking-tight">
                    <span className="font-mono font-semibold text-muted mr-1.5">{artifact.artifact_code}</span>
                    <span className="font-semibold">{artifact.name}</span>
                  </div>
                  {artifact.description && (
                    <div className="font-sans text-xs text-muted mt-1 leading-relaxed max-w-md">{artifact.description}</div>
                  )}
                </td>

                {/* Status */}
                <td className="py-4 px-6 align-middle">
                  <StatusDot status={status} />
                </td>

                {/* Actions */}
                <td className="py-4 px-6 align-middle" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => onCopyPrompt(artifact)}
                      className="py-2 px-3 rounded-lg text-xs font-semibold border border-accent/30 bg-accent-light text-accent hover:bg-accent hover:text-white hover:border-accent transition-all duration-200"
                    >
                      📋 Prompt
                    </button>
                    <button
                      type="button"
                      onClick={() => hasResult && onCopyResult(artifact)}
                      disabled={!hasResult}
                      title={!hasResult ? 'Kein Ergebnis vorhanden' : 'Ergebnis kopieren'}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                        hasResult
                          ? 'border-green/30 bg-green/10 text-green hover:bg-green hover:text-white hover:border-green'
                          : 'border-border bg-surface text-muted opacity-40 cursor-not-allowed'
                      }`}
                    >
                      📄 Ergebnis
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectArtifact(artifact)}
                      title="Details öffnen"
                      className="py-2 px-3 rounded-lg text-xs font-semibold border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text transition-all duration-200"
                    >
                      ↗
                    </button>
                    {onDeleteArtifact && (
                      <button
                        type="button"
                        onClick={() => onDeleteArtifact(artifact)}
                        title="Artefakt löschen"
                        aria-label={`${artifact.name} löschen`}
                        className="py-2 px-2.5 rounded-lg text-xs font-medium border border-border bg-surface text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
