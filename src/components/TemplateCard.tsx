import type { TemplateRow } from '@/types/database.types'

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

const PREVIEW_MAX = 120

type TemplateCardProps = {
  template: TemplateRow
  view: 'grid' | 'list'
  onUse: (template: TemplateRow) => void
  onEdit?: (template: TemplateRow) => void
  onDelete?: (template: TemplateRow) => void
  /** Sync dieses Templates in bestehende verknüpfte Artefakte */
  onSyncToArtifacts?: (template: TemplateRow) => void
  /** ID des Templates, das gerade gesynct wird (für Loading-State) */
  syncingTemplateId?: string | null
}

function truncatePrompt(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trim() + '…'
}

export function TemplateCard({ template, view, onUse, onEdit, onDelete, onSyncToArtifacts, syncingTemplateId }: TemplateCardProps) {
  const phase = template.phase?.toUpperCase() || 'A'
  const badgeClass = PHASE_BADGE_CLASS[phase] ?? PHASE_BADGE_CLASS.F
  const preview = truncatePrompt(template.prompt_template, PREVIEW_MAX)

  if (view === 'list') {
    return (
      <div
        className="flex flex-wrap gap-3 items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-600 hover:shadow-md transition-all min-w-0"
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono flex-shrink-0 ${badgeClass}`}
        >
          {phase}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-sm truncate">{template.name}</div>
          {template.description && (
            <div className="text-xs text-slate-500 mt-0.5 truncate">{template.description}</div>
          )}
          <div className="text-2xs text-slate-500 font-mono mt-1 truncate">{preview}</div>
        </div>
        {template.tags?.length ? (
          <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
            {template.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-slate-100 text-2xs text-slate-500 uppercase font-medium truncate max-w-[72px]"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(template) }}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 shrink-0"
              title="Bearbeiten"
              aria-label="Template bearbeiten"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(template) }}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red/80 hover:border-red hover:text-white shrink-0"
              title="Löschen"
              aria-label="Template löschen"
            >
              🗑
            </button>
          )}
          <button
            type="button"
            onClick={() => onUse(template)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-blue-600 text-2xs font-medium hover:bg-indigo-50 hover:border-blue-600 whitespace-nowrap shrink-0"
          >
            Template anlegen
          </button>
          {onSyncToArtifacts && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSyncToArtifacts(template) }}
              disabled={syncingTemplateId === template.id}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-2xs font-medium hover:bg-slate-50 hover:border-slate-300 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {syncingTemplateId === template.id ? '…' : 'In Artefakte übernehmen'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-600 hover:shadow-md transition-all flex flex-col h-full min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-3 flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono flex-shrink-0 ${badgeClass}`}
        >
          {phase}
        </div>
        {template.tags?.length ? (
          <div className="flex gap-1 flex-wrap justify-end min-w-0">
            {template.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-slate-100 text-2xs text-slate-500 uppercase font-medium truncate max-w-[80px]"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <h3 className="font-semibold text-slate-900 text-sm mb-1 leading-snug truncate min-w-0">{template.name}</h3>
      {template.description && (
        <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2 min-w-0">{template.description}</p>
      )}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 font-mono text-2xs text-slate-600 leading-relaxed flex-1 min-h-[60px] overflow-hidden min-w-0">
        <span className="line-clamp-3">{preview}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 flex-shrink-0">
        <span className="text-2xs text-slate-500 truncate min-w-0 order-2 sm:order-1 w-full sm:w-auto">
          {template.artifact_code ? `${template.artifact_code} · ` : ''}
          {template.usage_count ?? 0}× verwendet
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 order-1 sm:order-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(template)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 shrink-0"
              title="Bearbeiten"
              aria-label="Template bearbeiten"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(template)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red/80 hover:border-red hover:text-white shrink-0"
              title="Löschen"
              aria-label="Template löschen"
            >
              🗑
            </button>
          )}
          <button
            type="button"
            onClick={() => onUse(template)}
            className="px-2.5 py-1.5 rounded-lg border border-blue-600 bg-indigo-50 text-blue-600 text-2xs font-medium hover:bg-blue-600/20 whitespace-nowrap shrink-0"
          >
            Template anlegen
          </button>
          {onSyncToArtifacts && (
            <button
              type="button"
              onClick={() => onSyncToArtifacts(template)}
              disabled={syncingTemplateId === template.id}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-2xs font-medium hover:bg-slate-50 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {syncingTemplateId === template.id ? '…' : 'In Artefakte übernehmen'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
