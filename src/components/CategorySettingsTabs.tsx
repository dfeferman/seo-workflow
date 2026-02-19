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
      <label className="block text-xs font-medium text-text-secondary mb-1.5 tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] bg-surface2 border border-border rounded-lg focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-all">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-light border border-accent/30 rounded-full text-xs font-medium text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
              className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
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

/** Editoriales Section-Header mit nummeriertem Label + Trennlinie */
function SectionHeader({ number, label }: { number: string; label: string }) {
  return (
    <div className="section-header">
      <span className="section-label">{number} · {label}</span>
      <div className="section-rule" />
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
  const [customPlaceholders, setCustomPlaceholders] = useState<Record<string, string>>({})

  const updateCategory = useUpdateCategory(category?.id, projectId)

  const syncFromCategory = useCallback((categoryData?: CategoryRow | null) => {
    const c = categoryData ?? category
    if (!c) return
    setName(c.name)
    setHubName(c.hub_name ?? '')
    setZielgruppen(c.zielgruppen ?? [])
    setShopTyp(c.shop_typ ?? SHOP_TYP_OPTIONS[0])
    setUsps(c.usps ?? '')
    setTon(c.ton ?? '')
    setNoGos(c.no_gos ?? '')
    setCustomPlaceholders((c.custom_placeholders && typeof c.custom_placeholders === 'object')
      ? { ...c.custom_placeholders }
      : {})
  }, [category])

  useEffect(() => {
    syncFromCategory()
  }, [syncFromCategory])

  const isCategory = category?.type === 'category'
  const isHub = isCategory && (category?.parent_id == null)

  const currentHubPlaceholders =
    category?.custom_placeholders && typeof category.custom_placeholders === 'object'
      ? category.custom_placeholders
      : {}
  const placeholdersDirty =
    !!category &&
    isHub &&
    JSON.stringify(customPlaceholders) !== JSON.stringify(currentHubPlaceholders)

  const isDirty =
    !!category &&
    (name !== category.name ||
      (hubName || '') !== (category.hub_name || '') ||
      JSON.stringify(zielgruppen.slice().sort()) !== JSON.stringify((category.zielgruppen ?? []).slice().sort()) ||
      (shopTyp || '') !== (category.shop_typ || '') ||
      (usps || '') !== (category.usps || '') ||
      (ton || '') !== (category.ton || '') ||
      (noGos || '') !== (category.no_gos || '') ||
      placeholdersDirty)

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
    if (isHub) {
      payload.custom_placeholders = Object.keys(customPlaceholders).length ? customPlaceholders : {}
    }
    updateCategory.mutate(payload, {
      onSuccess: (updated) => {
        if (updated) syncFromCategory(updated)
        else syncFromCategory()
      },
    })
  }

  const normalizePlaceholderKey = (key: string) => {
    const k = key.trim()
    if (!k) return ''
    return k.startsWith('[') && k.endsWith(']') ? k : `[${k}]`
  }

  const setPlaceholder = (key: string, value: string) => {
    const norm = normalizePlaceholderKey(key)
    if (!norm) return
    setCustomPlaceholders((prev) => ({ ...prev, [norm]: value }))
  }

  const removePlaceholder = (key: string) => {
    setCustomPlaceholders((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const addPlaceholder = () => {
    const newKey = normalizePlaceholderKey('[NEU]')
    setCustomPlaceholders((prev) => ({ ...prev, [newKey]: '' }))
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

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Inner sub-tabs (Metadaten / Unterkategorien / Erweitert) */}
      <div className="flex gap-0 px-7 pt-2 pb-0 border-b border-border bg-bg flex-shrink-0">
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
        {/* Typ-Badge */}
        <div className="ml-auto flex items-center pb-2.5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-light text-accent border border-accent/20">
            {isCategory ? '🏷️ Kategorie' : '📝 Blog'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-7">
        {activeTab === 'metadaten' && (
          <div className={`flex gap-8 ${isHub ? 'flex-row' : ''} max-w-5xl`}>
            <div className="space-y-7 flex-1 min-w-0 max-w-2xl">

              {/* 01 · Grunddaten */}
              <section>
                <SectionHeader number="01" label="Grunddaten" />
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5 tracking-wide">
                      Name <span className="text-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    />
                  </div>
                  {isCategory && (
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 tracking-wide">
                        Hub-Seite Name
                      </label>
                      <input
                        type="text"
                        value={hubName}
                        onChange={(e) => setHubName(e.target.value)}
                        placeholder="z.B. Oberkategorie Hub"
                        className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* 02 · Zielgruppe & Shop */}
              <section>
                <SectionHeader number="02" label="Zielgruppe & Shop" />
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
                  <TagsField
                    tags={zielgruppen}
                    onChange={setZielgruppen}
                    label="Zielgruppen"
                    placeholder="Enter zum Hinzufügen…"
                  />
                  {isCategory && (
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 tracking-wide">
                        Shop-Typ
                      </label>
                      <select
                        value={shopTyp}
                        onChange={(e) => setShopTyp(e.target.value)}
                        className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
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

              {/* 03 · Content-Richtlinien */}
              <section>
                <SectionHeader number="03" label="Content-Richtlinien" />
                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5 tracking-wide">
                      Tonalität
                    </label>
                    <input
                      type="text"
                      value={ton}
                      onChange={(e) => setTon(e.target.value)}
                      placeholder="z.B. Seriös-medizinisch, leicht verständlich"
                      className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5 tracking-wide">
                      No-Gos / Verbotene Aussagen
                    </label>
                    <textarea
                      value={noGos}
                      onChange={(e) => setNoGos(e.target.value)}
                      placeholder="Was darf NICHT geschrieben werden?"
                      rows={3}
                      className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-y min-h-[80px] transition-all"
                    />
                  </div>
                  {isCategory && (
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 tracking-wide">
                        USPs
                      </label>
                      <input
                        type="text"
                        value={usps}
                        onChange={(e) => setUsps(e.target.value)}
                        placeholder="Unique Selling Points"
                        className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      />
                    </div>
                  )}
                </div>
              </section>

            </div>

            {/* Platzhalter-Panel (nur Hub) */}
            {isHub && (
              <section className="bg-surface border border-border rounded-xl p-6 shadow-sm w-full max-w-md flex-shrink-0 self-start">
                <SectionHeader number="04" label="Platzhalter" />
                <p className="text-xs text-muted mb-4 leading-relaxed">
                  Gültig für diese Oberkategorie und alle Unterkategorien. In Vorlagen z. B. als{' '}
                  <code className="bg-surface2 px-1.5 py-0.5 rounded font-mono text-[11px]">[MEIN_TAG]</code> nutzbar.
                </p>
                <div className="space-y-3">
                  {Object.entries(customPlaceholders).map(([key, value], index) => (
                    <div key={`ph-${index}`} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={key.startsWith('[') && key.endsWith(']') ? key.slice(1, -1) : key}
                        onChange={(e) => {
                          const v = e.target.value
                          if (!v.trim()) return
                          const norm = normalizePlaceholderKey(v)
                          setCustomPlaceholders((prev) => {
                            const next = { ...prev }
                            delete next[key]
                            next[norm] = value
                            return next
                          })
                        }}
                        placeholder="MEIN_TAG"
                        className="flex-1 min-w-0 px-2.5 py-2 bg-surface2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setPlaceholder(key, e.target.value)}
                        placeholder="Ersetzungstext"
                        className="flex-1 min-w-0 px-2.5 py-2 bg-surface2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removePlaceholder(key)}
                        className="p-2 text-muted hover:text-red transition-colors rounded"
                        aria-label="Platzhalter entfernen"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPlaceholder}
                  className="mt-4 text-sm text-accent hover:underline font-medium transition-colors"
                >
                  + Platzhalter hinzufügen
                </button>
              </section>
            )}
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
        onDiscard={() => { updateCategory.reset(); syncFromCategory() }}
        isSaving={updateCategory.isPending}
        saveError={updateCategory.isError ? (updateCategory.error?.message ?? 'Fehler beim Speichern') : null}
      />
    </div>
  )
}
