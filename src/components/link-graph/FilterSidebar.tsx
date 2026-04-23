export function FilterSidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter</p>
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Typ</p>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Hub
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Unterkategorie
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Blog
        </label>
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Status</p>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Veröffentlicht
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Draft
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Geplant
        </label>
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Phase</p>
        <div className="grid grid-cols-3 gap-2">
          {['A', 'B', 'C', 'D', 'E', 'F'].map((phase) => (
            <button
              key={phase}
              type="button"
              disabled
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400 cursor-not-allowed"
            >
              {phase}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold text-slate-700 mb-2">Analyse</p>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Verwaiste Seiten
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-not-allowed opacity-50">
          <input type="checkbox" disabled className="rounded" /> Tote Enden
        </label>
      </div>
    </aside>
  )
}
