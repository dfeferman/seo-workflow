import { useState, useEffect, useCallback } from 'react'
import { useUpdateCategory, type CategoryUpdatePayload } from '@/hooks/useUpdateCategory'
import { SaveBar } from '@/components/SaveBar'
import { SubcategoryList } from '@/components/SubcategoryList'
import type { CategoryRow } from '@/types/database.types'

const SHOP_TYP_OPTIONS = [
  'B2C Medizinprodukte-Onlineshop',
  'B2B Medizinprodukte-Onlineshop',
  'B2C & B2B gemischt',
  'Marktplatz (Amazon, eBay)',
  'Fachhandel mit Onlineshop',
]

type TabId = 'metadaten' | 'unterkategorien' | 'erweitert'

type Props = {
  category: CategoryRow | null
  projectId: string
  onDirtyChange?: (dirty: boolean) => void
}

function TagsField({
  tags,
  onChange,
  label,
  placeholder = 'Enter zum Hinzufügen…',
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  label: string
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const t = input.trim()
    if (t && !tags.includes(t)) {
      onChange([...tags, t])
      setInput('')
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] bg-surface2 border border-border rounded-lg focus-within:ring-2 focus-within:ring-accent">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-1 bg-accent-light border border-accent rounded text-xs text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
              className="opacity-70 hover:opacity-100"
              aria-label={`${tag} entfernen`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 min-w-[100px] bg-transparent border-none py-1 px-1 text-sm text-text outline-none placeholder:text-muted"
        />
      </div>
    </div>
  )
}

export function CategorySettingsTabs({ category, projectId, onDirtyChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('metadaten')

  const [name, setName] = useState('')
  const [hubName, setHubName] = useState('')
  const [zielgruppen, setZielgruppen] = useState<string[]>([])
  const [shopTyp, setShopTyp] = useState('')
  const [usps, setUsps] = useState('')
  const [ton, setTon] = useState('')
  const [noGos, setNoGos] = useState('')

  const updateCategory = useUpdateCategory(category?.id, projectId)

  const syncFromCategory = useCallback(() => {
    if (!category) return
    setName(category.name)
    setHubName(category.hub_name ?? '')
    setZielgruppen(category.zielgruppen ?? [])
    setShopTyp(category.shop_typ ?? SHOP_TYP_OPTIONS[0])
    setUsps(category.usps ?? '')
    setTon(category.ton ?? '')
    setNoGos(category.no_gos ?? '')
  }, [category])

  useEffect(() => {
    syncFromCategory()
  }, [syncFromCategory])

  const isDirty =
    !!category &&
    (name !== category.name ||
      (hubName || '') !== (category.hub_name || '') ||
      JSON.stringify(zielgruppen.slice().sort()) !== JSON.stringify((category.zielgruppen ?? []).slice().sort()) ||
      (shopTyp || '') !== (category.shop_typ || '') ||
      (usps || '') !== (category.usps || '') ||
      (ton || '') !== (category.ton || '') ||
      (noGos || '') !== (category.no_gos || ''))

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const handleSave = () => {
    if (!category || !isDirty) return
    const payload: CategoryUpdatePayload = {
      name: name.trim() || category.name,
      hub_name: hubName.trim() || null,
      zielgruppen: zielgruppen.length ? zielgruppen : null,
      shop_typ: category.type === 'category' ? (shopTyp || null) : null,
      usps: usps.trim() || null,
      ton: ton.trim() || null,
      no_gos: noGos.trim() || null,
    }
    updateCategory.mutate(payload, {
      onSuccess: () => syncFromCategory(),
    })
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'metadaten', label: 'Metadaten' },
    { id: 'unterkategorien', label: 'Unterkategorien' },
    { id: 'erweitert', label: 'Erweitert' },
  ]

  if (!category) {
    return (
      <div className="py-12 text-center text-muted text-sm">
        Kategorie wird geladen…
      </div>
    )
  }

  const isCategory = category.type === 'category'
  const isHub = isCategory && category.parent_id == null

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex gap-0.5 px-7 pt-2 pb-0 border-b border-border bg-bg flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-7">
        {activeTab === 'metadaten' && (
          <div className="space-y-6 max-w-2xl">
            <section className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
                <h2 className="text-base font-semibold text-text flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Grundinformationen
                </h2>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-accent-light text-accent">
                  {isCategory ? '🏷️ Kategorie' : '📝 Blog'}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Name <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                </div>
                {isCategory && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Hub-Seite Name</label>
                    <input
                      type="text"
                      value={hubName}
                      onChange={(e) => setHubName(e.target.value)}
                      placeholder="z.B. Oberkategorie Hub"
                      className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-text flex items-center gap-2 mb-4">
                <span className="text-lg">🎯</span>
                Zielgruppe & Shop
              </h2>
              <div className="space-y-4">
                <TagsField
                  tags={zielgruppen}
                  onChange={setZielgruppen}
                  label="Zielgruppen"
                  placeholder="Enter zum Hinzufügen…"
                />
                {isCategory && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Shop-Typ</label>
                    <select
                      value={shopTyp}
                      onChange={(e) => setShopTyp(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    >
                      {SHOP_TYP_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold text-text flex items-center gap-2 mb-4">
                <span className="text-lg">✍️</span>
                Content-Richtlinien
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Tonalität</label>
                  <input
                    type="text"
                    value={ton}
                    onChange={(e) => setTon(e.target.value)}
                    placeholder="z.B. Seriös-medizinisch, leicht verständlich"
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">No-Gos / Verbotene Aussagen</label>
                  <textarea
                    value={noGos}
                    onChange={(e) => setNoGos(e.target.value)}
                    placeholder="Was darf NICHT geschrieben werden?"
                    rows={3}
                    className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-y min-h-[80px]"
                  />
                </div>
                {isCategory && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">USPs</label>
                    <input
                      type="text"
                      value={usps}
                      onChange={(e) => setUsps(e.target.value)}
                      placeholder="Unique Selling Points"
                      className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'unterkategorien' && (
          <div className="max-w-2xl">
            {isHub ? (
              <SubcategoryList
                projectId={projectId}
                categoryId={category.id}
              />
            ) : (
              <p className="text-sm text-muted py-4">
                Unterkategorien können nur bei Hub-Kategorien (Top-Level) verwaltet werden.
                {category.parent_id && ' Diese Kategorie ist eine Unterkategorie.'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'erweitert' && (
          <div className="max-w-2xl text-sm text-muted py-4">
            Erweiterte Einstellungen (z. B. Export, Archiv) können hier später ergänzt werden.
          </div>
        )}
      </div>

      <SaveBar
        show={isDirty}
        onSave={handleSave}
        onDiscard={syncFromCategory}
        isSaving={updateCategory.isPending}
      />
    </div>
  )
}
