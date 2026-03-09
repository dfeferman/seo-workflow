import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useCreateCategory, type CreateCategoryInput } from '@/hooks/useCreateCategory'
import type { ContentType } from '@/types/database.types'

const SHOP_TYP_OPTIONS = [
  'B2C Medizinprodukte-Onlineshop',
  'B2B Medizinprodukte-Onlineshop',
  'B2C & B2B gemischt',
  'Marktplatz (Amazon, eBay)',
  'Fachhandel mit Onlineshop',
]

type Props = {
  open: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

function TagInput({
  tags,
  onChange,
  placeholder = 'Enter zum Hinzufügen…',
  inputValue,
  onInputChange,
  separators,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  inputValue?: string
  onInputChange?: (value: string) => void
  /** Zusätzliche Tasten (z.B. Komma), bei denen der aktuelle Text getrennt und jede Teil als Tag hinzugefügt wird */
  separators?: string[]
}) {
  const [internalInput, setInternalInput] = useState('')
  const isControlled = onInputChange != null && inputValue !== undefined
  const input = isControlled ? inputValue : internalInput
  const setInput = isControlled ? onInputChange : setInternalInput

  const add = useCallback(
    (value?: string) => {
      const toAdd = (value ?? input).trim()
      if (toAdd && !tags.includes(toAdd)) {
        onChange([...tags, toAdd])
        setInput('')
      }
    },
    [input, tags, onChange, setInput]
  )

  const addMultiple = useCallback(
    (text: string, sep: string) => {
      const parts = text.split(sep).map((s) => s.trim()).filter(Boolean)
      const newTags = [...tags]
      for (const p of parts) {
        if (p && !newTags.includes(p)) newTags.push(p)
      }
      if (newTags.length > tags.length) {
        onChange(newTags)
        setInput('')
      }
    },
    [tags, onChange, setInput]
  )

  const remove = useCallback(
    (index: number) => {
      onChange(tags.filter((_, i) => i !== index))
    },
    [tags, onChange]
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
      return
    }
    if (separators?.length && separators.includes(e.key)) {
      e.preventDefault()
      addMultiple(input, e.key)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-accent focus-within:border-accent">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-accent rounded text-xs text-blue-600"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(i)}
            className="opacity-70 hover:opacity-100 text-current"
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
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] bg-transparent border-none py-1 px-1 text-sm text-slate-900 outline-none placeholder:text-slate-500"
      />
    </div>
  )
}

export function CreateCategoryModal({ open, onClose, projectId, projectName }: Props) {
  const [type, setType] = useState<ContentType>('category')
  const [name, setName] = useState('')
  const [hubName, setHubName] = useState('')
  const [subcategoryTags, setSubcategoryTags] = useState<string[]>([])
  const [themeKeyword, setThemeKeyword] = useState('')
  const [zielgruppen, setZielgruppen] = useState<string[]>([])
  const [zielgruppenInput, setZielgruppenInput] = useState('')
  const [shopTyp, setShopTyp] = useState(SHOP_TYP_OPTIONS[0])
  const [ton, setTon] = useState('Seriös-medizinisch, leicht verständlich')
  const [noGos, setNoGos] = useState('Keine Heilversprechen, keine Garantien, keine Angst-Kommunikation')
  const [usps, setUsps] = useState('')

  const { createAndGo, isPending, error } = useCreateCategory()

  const artifactCount = type === 'category' ? 18 : 12

  const reset = useCallback(() => {
    setType('category')
    setName('')
    setHubName('')
    setSubcategoryTags([])
    setThemeKeyword('')
    setZielgruppen([])
    setZielgruppenInput('')
    setShopTyp(SHOP_TYP_OPTIONS[0])
    setTon('Seriös-medizinisch, leicht verständlich')
    setNoGos('Keine Heilversprechen, keine Garantien, keine Angst-Kommunikation')
    setUsps('')
  }, [])

  useEffect(() => {
    if (!open) return
    reset()
  }, [open, reset])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pending = zielgruppenInput.trim()
    const zielgruppenFinal =
      pending && !zielgruppen.includes(pending) ? [...zielgruppen, pending] : zielgruppen
    if (!name.trim()) return
    if (zielgruppenFinal.length === 0) return

    const input: CreateCategoryInput = {
      projectId,
      type,
      name: name.trim(),
      zielgruppen: zielgruppenFinal,
      hub_name: type === 'category' ? (hubName.trim() || name.trim()) : null,
      subcategoryNames: type === 'category' ? subcategoryTags.filter(Boolean) : undefined,
      shop_typ: type === 'category' ? shopTyp : null,
      usps: usps.trim() || null,
      ton: ton.trim() || null,
      no_gos: noGos.trim() || null,
    }
    try {
      await createAndGo(input)
      onClose()
    } catch {
      // Error is shown below
    }
  }

  if (!open) return null

  const body = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-labelledby="create-category-title">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-lg">
              ＋
            </div>
            <div>
              <h2 id="create-category-title" className="text-lg font-semibold text-slate-900">Neue Kategorie/Blog anlegen</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Projekt: <strong>{projectName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Type selector */}
        <div className="px-5 pt-4 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setType('category')}
            className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
              type === 'category'
                ? 'border-accent bg-indigo-50/50'
                : 'border-slate-200 bg-white hover:border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🏷️</span>
              <span className="font-semibold text-slate-900">Kategorie</span>
              <span className="text-2xs text-slate-500 uppercase tracking-wide">Shop-Content</span>
            </div>
            <p className="text-sm text-slate-500 mb-2">Für Produktkategorien mit Unterkategorien (Hub & Spoke)</p>
            <ul className="text-xs text-slate-600 space-y-0.5">
              <li>✓ 18 Artefakte (Phase A–F)</li>
              <li>✓ Unterkategorien-Management</li>
            </ul>
          </button>
          <button
            type="button"
            onClick={() => setType('blog')}
            className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
              type === 'blog' ? 'border-accent bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📝</span>
              <span className="font-semibold text-slate-900">Blog-Artikel</span>
              <span className="text-2xs text-slate-500 uppercase tracking-wide">Content-Marketing</span>
            </div>
            <p className="text-sm text-slate-500 mb-2">Für informative Artikel, Ratgeber und Blog-Posts</p>
            <ul className="text-xs text-slate-600 space-y-0.5">
              <li>✓ 12 Artefakte (reduziert)</li>
              <li>✓ Schnellerer Workflow</li>
            </ul>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-5">
            {/* Grundinformationen */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">📋 Grundinformationen</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Oberkategorie"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-accent"
                    autoFocus
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Name der Kategorie oder des Blog-Artikels</p>
                </div>

                {type === 'category' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Hub-Seite Name</label>
                      <input
                        type="text"
                        value={hubName}
                        onChange={(e) => setHubName(e.target.value)}
                        placeholder="z.B. Oberkategorie Hub"
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Unterkategorien</label>
                      <TagInput
                        tags={subcategoryTags}
                        onChange={setSubcategoryTags}
                        placeholder="Name eingeben, Enter oder Komma zum Hinzufügen"
                        separators={[',']}
                      />
                      <p className="text-xs text-slate-500 mt-1.5">Mehrere mit Komma getrennt möglich (z.B. Händedesinfektion, Flächendesinfektion, Flächenreinigung)</p>
                    </div>
                  </div>
                )}

                {type === 'blog' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Thema / Fokus-Keyword</label>
                    <input
                      type="text"
                      value={themeKeyword}
                      onChange={(e) => setThemeKeyword(e.target.value)}
                      placeholder="z.B. Hygiene im Gesundheitswesen"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-accent"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Hauptthema des Blog-Artikels (optional)</p>
                  </div>
                )}
              </div>
            </section>

            {/* Zielgruppe & Shop */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">🎯 Zielgruppe & Shop</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">
                    Zielgruppen <span className="text-red-600">*</span>
                  </label>
                  <TagInput
                    tags={zielgruppen}
                    onChange={setZielgruppen}
                    inputValue={zielgruppenInput}
                    onInputChange={setZielgruppenInput}
                    placeholder={zielgruppen.length === 0 ? 'z.B. Privat – eingeben und Enter drücken' : 'Weitere hinzufügen…'}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Mindestens eine Zielgruppe nötig. Text eingeben und Enter drücken.</p>
                </div>
                {type === 'category' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Shop-Typ</label>
                    <select
                      value={shopTyp}
                      onChange={(e) => setShopTyp(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-accent"
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

            {/* Content-Richtlinien */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">✍️ Content-Richtlinien</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Tonalität</label>
                  <input
                    type="text"
                    value={ton}
                    onChange={(e) => setTon(e.target.value)}
                    placeholder="z.B. Professionell, freundlich, beratend"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">No-Gos / Verbotene Aussagen</label>
                  <textarea
                    value={noGos}
                    onChange={(e) => setNoGos(e.target.value)}
                    placeholder="Was darf NICHT geschrieben werden?"
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-accent resize-y min-h-[60px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">USPs (optional)</label>
                  <input
                    type="text"
                    value={usps}
                    onChange={(e) => setUsps(e.target.value)}
                    placeholder="Unique Selling Points"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-accent"
                  />
                </div>
              </div>
            </section>

            <div className="bg-indigo-50 border border-accent/25 rounded-lg p-3 flex gap-2.5 text-sm text-slate-600">
              <span className="text-lg flex-shrink-0">💡</span>
              <p>
                <strong className="text-blue-600">Hinweis:</strong> Nach dem Anlegen werden automatisch alle Standard-Artefakte
                für diese Kategorie/Blog erstellt. Du kannst sie dann Schritt für Schritt abarbeiten.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">
                {error instanceof Error ? error.message : 'Fehler beim Anlegen.'}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-100 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-slate-500">{artifactCount} Artefakte werden erstellt</span>
              {(!name.trim() || (zielgruppen.length === 0 && !zielgruppenInput.trim())) && (
                <span className="text-xs text-red-600">
                  Bitte Name ausfüllen und mind. eine Zielgruppe angeben.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!name.trim() || (zielgruppen.length === 0 && !zielgruppenInput.trim()) || isPending}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Wird angelegt…' : 'Anlegen & starten'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(body, document.body)
}
