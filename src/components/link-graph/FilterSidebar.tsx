import type { LinkGraphFilters } from './linkGraphFilter'
import { PHASE_OPTIONS, togglePhaseFilter, toggleStatusFilter, toggleTypeFilter } from './linkGraphFilter'

type Props = {
  filters: LinkGraphFilters
  onChange: (next: LinkGraphFilters) => void
  graphEditActions?: {
    onAddPage: () => void
    onAddLink: () => void
  }
}

const TYPE_META: { key: 'hub' | 'spoke' | 'blog'; label: string }[] = [
  { key: 'hub', label: 'Hub' },
  { key: 'spoke', label: 'Spoke' },
  { key: 'blog', label: 'Blog' },
]

const STATUS_META: { key: 'published' | 'draft' | 'planned'; label: string }[] = [
  { key: 'published', label: 'Veröffentlicht' },
  { key: 'draft', label: 'Entwurf' },
  { key: 'planned', label: 'Geplant' },
]

export function FilterSidebar({ filters, onChange, graphEditActions }: Props) {
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter</p>
        <p className="text-2xs text-slate-400 mt-1 leading-snug">
          Leere Auswahl bei Typ/Status/Phase = alle anzeigen.
        </p>
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Typ</p>
        {TYPE_META.map(({ key, label }) => {
          const checked = filters.types.length === 0 || filters.types.includes(key)
          return (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleTypeFilter(filters, key))}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              {label}
            </label>
          )
        })}
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Status</p>
        {STATUS_META.map(({ key, label }) => {
          const checked = filters.statuses.length === 0 || filters.statuses.includes(key)
          return (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleStatusFilter(filters, key))}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              {label}
            </label>
          )
        })}
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Phase (Artefakt)</p>
        <div className="grid grid-cols-4 gap-1.5">
          {PHASE_OPTIONS.map((phase) => {
            const active = filters.phases.includes(phase)
            return (
              <button
                key={phase}
                type="button"
                onClick={() => onChange(togglePhaseFilter(filters, phase))}
                className={`rounded-md border px-1.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {phase}
              </button>
            )
          })}
        </div>
        <p className="text-2xs text-slate-400 mt-2 leading-snug">
          Nur Seiten mit Kategorie, die Artefakte in gewählter Phase haben. Ohne Auswahl: alle inkl. ohne Kategorie.
        </p>
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold text-slate-700 mb-2">Analyse</p>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.orphansOnly}
            onChange={() => onChange({ ...filters, orphansOnly: !filters.orphansOnly })}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          Verwaiste Seiten
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.deadEndsOnly}
            onChange={() => onChange({ ...filters, deadEndsOnly: !filters.deadEndsOnly })}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          Tote Enden
        </label>
      </div>

      {graphEditActions && (
        <div className="p-4 border-t border-slate-100 mt-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Graph bearbeiten</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={graphEditActions.onAddPage}
              className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            >
              Seite anlegen
            </button>
            <button
              type="button"
              onClick={graphEditActions.onAddLink}
              className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            >
              Link anlegen
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
