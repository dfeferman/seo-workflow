import { useState, useEffect, useCallback } from 'react'
import { useUpdateCategory, type CategoryUpdatePayload } from '@/hooks/useUpdateCategory'
import { useCategoryReferenceDocs, useUpsertCategoryReferenceDoc, useDeleteCategoryReferenceDoc } from '@/hooks/useCategoryReferenceDocs'
import type { CategoryReferenceDocRow } from '@/types/database.types'
import { SaveBar } from '@/components/SaveBar'
import { SubcategoryList } from '@/components/SubcategoryList'
import { PhaseOutputTemplateEditor } from '@/components/PhaseOutputTemplateEditor'
import type { CategoryRow } from '@/types/database.types'

const SHOP_TYP_OPTIONS = [
  'B2C Medizinprodukte-Onlineshop',
  'B2B Medizinprodukte-Onlineshop',
  'B2C & B2B gemischt',
  'Marktplatz (Amazon, eBay)',
  'Fachhandel mit Onlineshop',
]

type TabId = 'metadaten' | 'unterkategorien' | 'phase-outputs' | 'erweitert'

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
      <label className="block text-xs font-medium text-slate-700 mb-1.5 tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-slate-400 transition-all">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700"
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
          className="flex-1 min-w-[100px] bg-transparent border-none py-1 px-1 text-sm text-slate-800 outline-none placeholder:text-slate-500"
        />
      </div>
    </div>
  )
}

/** Editoriales Section-Header mit nummeriertem Label + Trennlinie */
function SectionHeader({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex-shrink-0">{number} · {label}</span>
      <div className="flex-1 h-px bg-slate-200" />
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
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [docContent, setDocContent] = useState('')

  const updateCategory = useUpdateCategory(category?.id, projectId)
  const { data: referenceDocs = [] } = useCategoryReferenceDocs(category?.id)
  const upsertDoc = useUpsertCategoryReferenceDoc()
  const deleteDoc = useDeleteCategoryReferenceDoc()

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

  const handleExportDoc = (doc: CategoryReferenceDocRow) => {
    const blob = new Blob([doc.content ?? ''], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeTitle = doc.title?.trim() || 'referenz'
    a.href = url
    a.download = safeTitle.toLowerCase().endsWith('.md') ? safeTitle : `${safeTitle}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const startNewDoc = () => {
    setEditingDocId(null)
    setDocTitle('')
    setDocContent('')
  }

  const startEditDoc = (id: string, title: string, content: string) => {
    setEditingDocId(id)
    setDocTitle(title)
    setDocContent(content)
  }

  const handleSaveDoc = () => {
    if (!category?.id || !docTitle.trim()) return
    upsertDoc.mutate({
      id: editingDocId ?? undefined,
      category_id: category.id,
      title: docTitle.trim(),
      content: docContent,
    })
    setEditingDocId(null)
    setDocTitle('')
    setDocContent('')
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'metadaten', label: 'Metadaten' },
    { id: 'unterkategorien', label: 'Unterkategorien' },
    { id: 'phase-outputs', label: 'Phase-Outputs' },
    { id: 'erweitert', label: 'Erweitert' },
  ]

  if (!category) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        Kategorie wird geladen…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Inner sub-tabs (Metadaten / Unterkategorien / Erweitert) */}
      <div className="flex gap-0 px-7 pt-2 pb-0 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-slate-400 text-slate-900 bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {/* Typ-Badge */}
        <div className="ml-auto flex items-center pb-2.5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {isCategory ? '🏷️ Kategorie' : '📝 Blog'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-7">
        {activeTab === 'metadaten' && (
          <div className={`flex gap-8 ${isHub ? 'flex-row' : ''} max-w-5xl`}>
            <div className="space-y-7 w-full max-w-md">

              {/* 01 · Grunddaten */}
              <section>
                <SectionHeader number="01" label="Grunddaten" />
                <div className="bg-white border border-slate-100 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 tracking-wide">
                      Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                    />
                  </div>
                  {isCategory && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 tracking-wide">
                        Hub-Seite Name
                      </label>
                      <input
                        type="text"
                        value={hubName}
                        onChange={(e) => setHubName(e.target.value)}
                        placeholder="z.B. Oberkategorie Hub"
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* 02 · Zielgruppe & Shop */}
              <section>
                <SectionHeader number="02" label="Zielgruppe & Shop" />
                <div className="bg-white border border-slate-100 rounded-xl p-6 space-y-4">
                  <TagsField
                    tags={zielgruppen}
                    onChange={setZielgruppen}
                    label="Zielgruppen"
                    placeholder="Enter zum Hinzufügen…"
                  />
                  {isCategory && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 tracking-wide">
                        Shop-Typ
                      </label>
                      <select
                        value={shopTyp}
                        onChange={(e) => setShopTyp(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
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
                <div className="bg-white border border-slate-100 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 tracking-wide">
                      Tonalität
                    </label>
                    <input
                      type="text"
                      value={ton}
                      onChange={(e) => setTon(e.target.value)}
                      placeholder="z.B. Seriös-medizinisch, leicht verständlich"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 tracking-wide">
                      No-Gos / Verbotene Aussagen
                    </label>
                    <textarea
                      value={noGos}
                      onChange={(e) => setNoGos(e.target.value)}
                      placeholder="Was darf NICHT geschrieben werden?"
                      rows={3}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 resize-y min-h-[80px] transition-all"
                    />
                  </div>
                  {isCategory && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 tracking-wide">
                        USPs
                      </label>
                      <input
                        type="text"
                        value={usps}
                        onChange={(e) => setUsps(e.target.value)}
                        placeholder="Unique Selling Points"
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                      />
                    </div>
                  )}
                </div>
              </section>

            </div>

            <div className="w-full max-w-md flex-shrink-0 self-start">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {/* 04 · Platzhalter (links, behält seine Breite) */}
                {isHub && (
                  <section className="bg-white border border-slate-100 rounded-xl p-6 w-full max-w-md">
                    <SectionHeader number="04" label="Platzhalter" />
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Gültig für diese Oberkategorie und alle Unterkategorien. In Vorlagen z. B. als{' '}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">[MEIN_TAG]</code> nutzbar.
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
                            className="flex-1 min-w-0 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setPlaceholder(key, e.target.value)}
                            placeholder="Ersetzungstext"
                            className="flex-1 min-w-0 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => removePlaceholder(key)}
                            className="p-2 text-slate-500 hover:text-red-600 transition-colors rounded"
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
                      className="mt-4 text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium transition-colors"
                    >
                      + Platzhalter hinzufügen
                    </button>
                  </section>
                )}

                {/* 05 · Referenz-Dokumente (.md) – rechts von 04, mit eigener Breite */}
                <section className="bg-white border border-slate-100 rounded-xl p-6 w-full lg:flex-1">
                  <SectionHeader number="05" label="Referenz-Dokumente (.md)" />
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    Hier kannst du Markdown-Dokumente (Guidelines, Briefings, Beispiele) für diese Kategorie speichern.
                    Beim Arbeiten mit den Artefakten kannst du sie mit einem Klick kopieren und in ChatGPT oder Perplexity einfügen.
                  </p>
                  <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
                    {referenceDocs.length === 0 && (
                      <p className="text-xs text-slate-400">Noch keine Referenz-Dokumente angelegt.</p>
                    )}
                    {referenceDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-indigo-100 bg-indigo-50/80"
                      >
                        <button
                          type="button"
                          onClick={() => startEditDoc(doc.id, doc.title, doc.content)}
                          className="text-xs font-semibold text-indigo-900 hover:text-indigo-950 truncate text-left flex-1"
                        >
                          {doc.title}
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(doc.content ?? '')}
                            className="px-2 py-1 rounded text-2xs font-medium border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                          >
                            Kopieren
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportDoc(doc)}
                            className="px-2 py-1 rounded text-2xs font-medium border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                          >
                            .md
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDoc.mutate({ id: doc.id, category_id: doc.category_id })}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                            aria-label="Referenz-Dokument löschen"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Titel, z.B. Guidelines.md"
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                    />
                    <textarea
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      placeholder="Markdown-Inhalt…"
                      rows={5}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y min-h-[120px]"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <button
                        type="button"
                        onClick={startNewDoc}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Neu anfangen
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDoc}
                        disabled={!docTitle.trim() || upsertDoc.isPending || !category?.id}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50"
                      >
                        {editingDocId ? 'Änderungen speichern' : 'Dokument speichern'}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
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
              <p className="text-sm text-slate-500 py-4">
                Unterkategorien können nur bei Hub-Kategorien (Top-Level) verwaltet werden.
                {category.parent_id && ' Diese Kategorie ist eine Unterkategorie.'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'phase-outputs' && (
          <div className="max-w-3xl">
            <PhaseOutputTemplateEditor />
          </div>
        )}

        {activeTab === 'erweitert' && (
          <div className="max-w-2xl text-sm text-slate-500 py-4">
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
