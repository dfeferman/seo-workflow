import { useCategory } from '@/hooks/useCategory'
import type { PageLinkRow, PageRow } from '@/types/database.types'

interface NodeDetailsPanelProps {
  page: PageRow
  pages: PageRow[]
  pageLinks: PageLinkRow[]
  onClose: () => void
}

const TYPE_BADGE: Record<string, string> = {
  hub: 'bg-blue-100 text-blue-700 border-blue-300',
  spoke: 'bg-green-100 text-green-700 border-green-300',
  blog: 'bg-yellow-100 text-yellow-700 border-yellow-300',
}

const TYPE_LABEL: Record<string, string> = {
  hub: 'Hub',
  spoke: 'Spoke',
  blog: 'Blog',
}

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  planned: 'bg-slate-100 text-slate-500',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Veröffentlicht',
  draft: 'Entwurf',
  planned: 'Geplant',
}

export function NodeDetailsPanel({ page, pages, pageLinks, onClose }: NodeDetailsPanelProps) {
  const { data: category } = useCategory(page.category_id ?? undefined)

  const pageById = new Map(pages.map((p) => [p.id, p]))

  const incoming = pageLinks.filter((l) => l.to_page_id === page.id)
  const outgoing = pageLinks.filter((l) => l.from_page_id === page.id)

  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-white border-l border-slate-200 shadow-lg flex flex-col z-10 overflow-y-auto">
      <div className="flex items-start justify-between p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 truncate">{page.name}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${TYPE_BADGE[page.type] ?? 'bg-slate-100 text-slate-600 border-slate-300'}`}
            >
              {TYPE_LABEL[page.type] ?? page.type}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[page.status] ?? 'bg-slate-100 text-slate-500'}`}
            >
              {STATUS_LABEL[page.status] ?? page.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 flex-shrink-0 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          aria-label="Panel schließen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 border-b border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Wortcount</span>
          <span className="font-medium text-slate-700">{page.word_count ?? 0}</span>
        </div>
        {page.url_slug && (
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="text-slate-500 shrink-0">URL-Slug</span>
            <span className="font-medium text-slate-700 truncate min-w-0" title={page.url_slug}>
              {page.url_slug}
            </span>
          </div>
        )}
        {category && (
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="text-slate-500 shrink-0">Kategorie</span>
            <span className="font-medium text-slate-700 truncate min-w-0" title={String(category.name ?? '')}>
              {String(category.name ?? '')}
            </span>
          </div>
        )}
        {category?.phase != null && category.phase !== '' && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Phase</span>
            <span className="font-medium text-slate-700">{String(category.phase)}</span>
          </div>
        )}
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Eingehende Links ({incoming.length})
        </p>
        {incoming.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Keine eingehenden Links</p>
        ) : (
          <ul className="space-y-1.5">
            {incoming.map((link) => {
              const fromPage = pageById.get(link.from_page_id)
              return (
                <li key={link.id} className="text-xs">
                  <span className="text-slate-400">von </span>
                  <span className="font-medium text-slate-700">{fromPage?.name ?? link.from_page_id}</span>
                  {link.anchor_text && (
                    <span className="text-slate-400"> · „{link.anchor_text}"</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Ausgehende Links ({outgoing.length})
        </p>
        {outgoing.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Keine ausgehenden Links</p>
        ) : (
          <ul className="space-y-1.5">
            {outgoing.map((link) => {
              const toPage = pageById.get(link.to_page_id)
              return (
                <li key={link.id} className="text-xs">
                  <span className="text-slate-400">nach </span>
                  <span className="font-medium text-slate-700">{toPage?.name ?? link.to_page_id}</span>
                  {link.anchor_text && (
                    <span className="text-slate-400"> · „{link.anchor_text}"</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="p-4 space-y-2 mt-auto">
        <button
          type="button"
          disabled={!page.markdown_file_path}
          title={page.markdown_file_path ? 'Editor-View kommt in SP22' : 'Kein Dokument verknüpft'}
          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
        >
          Im Editor öffnen
        </button>
        <button
          type="button"
          disabled
          title="Bearbeiten kommt in SP23"
          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
        >
          Bearbeiten
        </button>
        <button
          type="button"
          disabled
          title="Löschen kommt in SP23"
          className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-red-100 bg-white text-red-300 cursor-not-allowed"
        >
          Löschen
        </button>
      </div>
    </div>
  )
}
