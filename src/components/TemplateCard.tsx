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
}

function truncatePrompt(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trim() + '…'
}

export function TemplateCard({ template, view, onUse }: TemplateCardProps) {
  const phase = template.phase?.toUpperCase() || 'A'
  const badgeClass = PHASE_BADGE_CLASS[phase] ?? PHASE_BADGE_CLASS.F
  const preview = truncatePrompt(template.prompt_template, PREVIEW_MAX)

  if (view === 'list') {
    return (
      <div
        className="flex gap-4 items-center p-4 bg-surface border border-border rounded-xl hover:border-accent hover:shadow-md transition-all"
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono flex-shrink-0 ${badgeClass}`}
        >
          {phase}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-text text-sm">{template.name}</div>
          {template.description && (
            <div className="text-xs text-muted mt-0.5 truncate">{template.description}</div>
          )}
          <div className="text-2xs text-muted font-mono mt-1 truncate">{preview}</div>
        </div>
        {template.tags?.length ? (
          <div className="flex gap-1.5 flex-shrink-0">
            {template.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-surface2 text-2xs text-muted uppercase font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => onUse(template)}
          className="px-3 py-1.5 rounded-lg border border-border bg-surface text-accent text-xs font-medium hover:bg-accent-light hover:border-accent flex-shrink-0"
        >
          Template verwenden
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-accent hover:shadow-md transition-all flex flex-col h-full">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono flex-shrink-0 ${badgeClass}`}
        >
          {phase}
        </div>
        {template.tags?.length ? (
          <div className="flex gap-1 flex-wrap justify-end">
            {template.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-surface2 text-2xs text-muted uppercase font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <h3 className="font-semibold text-text text-sm mb-1 leading-snug">{template.name}</h3>
      {template.description && (
        <p className="text-xs text-muted leading-relaxed mb-3 line-clamp-2">{template.description}</p>
      )}
      <div className="bg-surface2 border border-border rounded-lg p-2.5 font-mono text-2xs text-text-secondary leading-relaxed flex-1 min-h-[60px] overflow-hidden">
        <span className="line-clamp-3">{preview}</span>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <span className="text-2xs text-muted">
          {template.artifact_code ? `${template.artifact_code} · ` : ''}
          {template.usage_count ?? 0}× verwendet
        </span>
        <button
          type="button"
          onClick={() => onUse(template)}
          className="px-3 py-1.5 rounded-lg border border-accent bg-accent-light text-accent text-xs font-medium hover:bg-accent/20"
        >
          Template verwenden
        </button>
      </div>
    </div>
  )
}
