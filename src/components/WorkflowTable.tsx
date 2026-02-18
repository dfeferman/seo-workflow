import type { ArtifactRow } from '@/types/database.types'
import type { ArtifactStatus, ArtifactStatusMap } from '@/hooks/useArtifacts'
const PHASE_BADGE: Record<string, { bg: string; text: string }> = {
  A: { bg: 'bg-[#f3e8ff]', text: 'text-[#7c3aed]' },
  B: { bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]' },
  C: { bg: 'bg-[#fef3c7]', text: 'text-[#d97706]' },
  D: { bg: 'bg-[#d1fae5]', text: 'text-[#059669]' },
  E: { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]' },
  F: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' },
  G: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' },
  X: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' },
}

function statusLabel(s: ArtifactStatus): string {
  switch (s) {
    case 'done': return 'Abgeschlossen'
    case 'active': return 'In Arbeit'
    default: return 'Offen'
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
    status === 'done'
      ? 'text-green'
      : status === 'active'
        ? 'text-yellow'
        : 'text-muted'
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium ${textClass}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
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
      <div className="flex-1 flex items-center justify-center py-12 text-muted text-sm">
        Keine Artefakte in dieser Kategorie.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-7 pb-7 bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-border sticky top-0 bg-surface z-10">
              <th className="text-left py-3 px-3.5 w-[50px] text-2xs font-semibold uppercase tracking-wider text-muted">
                Phase
              </th>
              <th className="text-left py-3 px-3.5 text-2xs font-semibold uppercase tracking-wider text-muted">
                Artefakt
              </th>
              <th className="text-left py-3 px-3.5 w-[120px] text-2xs font-semibold uppercase tracking-wider text-muted">
                Status
              </th>
              <th className="text-left py-3 px-3.5 w-[220px] text-2xs font-semibold uppercase tracking-wider text-muted">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((artifact) => {
              const status = statusMap[artifact.id] ?? 'open'
              const colors = PHASE_BADGE[artifact.phase] ?? PHASE_BADGE.F
              const isSelected = selectedArtifactId === artifact.id
              return (
                <tr
                  key={artifact.id}
                  onClick={() => onSelectArtifact(artifact)}
                  className={`border-b border-border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-accent-light border-l-4 border-l-accent'
                      : 'hover:bg-surface-2'
                  }`}
                >
                  <td className="py-3.5 px-3.5 align-middle">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono ${colors.bg} ${colors.text}`}
                    >
                      {artifact.phase}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 align-middle">
                    <div className="font-semibold text-text leading-snug">
                      {artifact.artifact_code} · {artifact.name}
                    </div>
                    {artifact.description && (
                      <div className="text-xs text-muted mt-0.5 leading-snug">
                        {artifact.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3.5 align-middle">
                    <StatusDot status={status} />
                  </td>
                  <td className="py-3.5 px-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        className="py-1.5 px-2.5 rounded-md text-xs font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text hover:border-[#d0d4d8] transition-all bg-accent-light border-accent text-accent hover:bg-[#dbe4ff]"
                        onClick={() => onCopyPrompt(artifact)}
                      >
                        📋 Prompt
                      </button>
                      <button
                        type="button"
                        className={`py-1.5 px-2.5 rounded-md text-xs font-medium border border-border transition-all ${
                          status !== 'open'
                            ? 'bg-accent-light border-accent text-accent hover:bg-[#dbe4ff]'
                            : 'bg-surface text-text-secondary hover:bg-surface-2 hover:text-text'
                        }`}
                        onClick={() => status !== 'open' && onCopyResult(artifact)}
                        disabled={status === 'open'}
                        title={status === 'open' ? 'Kein Ergebnis vorhanden' : 'Ergebnis kopieren'}
                      >
                        📄 Ergebnis
                      </button>
                      <button
                        type="button"
                        className="py-1.5 px-2.5 rounded-md text-xs font-medium border border-border bg-surface text-text-secondary hover:bg-surface-2 hover:text-text transition-all"
                        onClick={() => onSelectArtifact(artifact)}
                        title="Details"
                      >
                        ↗
                      </button>
                      {onDeleteArtifact && (
                        <button
                          type="button"
                          className="py-1.5 px-2 rounded-md text-xs font-medium border border-border bg-surface text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                          onClick={() => onDeleteArtifact(artifact)}
                          title="Artefakt löschen"
                          aria-label={`${artifact.name} löschen`}
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
