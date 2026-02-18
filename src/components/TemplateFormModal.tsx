import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSaveTemplate } from '@/hooks/useSaveTemplate'
import { useUpdateTemplate } from '@/hooks/useUpdateTemplate'
import type { TemplateRow } from '@/types/database.types'

const PHASES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X'] as const
const SUGGESTED_TAGS = ['SEO', 'Analyse', 'Content', 'Recherche', 'Briefing', 'Meta', 'E-E-A-T']

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState('')

  const add = useCallback(() => {
    const t = input.trim()
    if (t && !tags.includes(t)) {
      onChange([...tags, t])
      setInput('')
    }
  }, [input, tags, onChange])

  return (
    <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] bg-surface border border-border rounded-lg focus-within:ring-2 focus-within:ring-accent">
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
  )
}

type Props = {
  open: boolean
  onClose: () => void
  /** Bei null: neues Template anlegen; sonst: bestehendes bearbeiten */
  template: TemplateRow | null
  onSaved?: () => void
}

export function TemplateFormModal({ open, onClose, template, onSaved }: Props) {
  const isEdit = template != null
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<string>('A')
  const [artifactCode, setArtifactCode] = useState('')
  const [promptTemplate, setPromptTemplate] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const saveTemplate = useSaveTemplate()
  const updateTemplate = useUpdateTemplate()

  useEffect(() => {
    if (open) {
      setError(null)
      if (template) {
        setName(template.name)
        setDescription(template.description ?? '')
        setPhase(template.phase?.toUpperCase() ?? 'A')
        setArtifactCode(template.artifact_code ?? '')
        setPromptTemplate(template.prompt_template ?? '')
        setTags(template.tags ?? [])
      } else {
        setName('')
        setDescription('')
        setPhase('A')
        setArtifactCode('')
        setPromptTemplate('')
        setTags([])
      }
    }
  }, [open, template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Bitte einen Namen angeben.')
      return
    }
    if (!promptTemplate.trim()) {
      setError('Bitte ein Prompt-Template angeben.')
      return
    }
    const phaseChar = phase as (typeof PHASES)[number]
    if (!PHASES.includes(phaseChar)) {
      setError('Bitte eine gültige Phase wählen.')
      return
    }
    try {
      if (isEdit && template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          name: name.trim(),
          description: description.trim() || null,
          phase: phaseChar,
          artifact_code: artifactCode.trim() || null,
          prompt_template: promptTemplate.trim(),
          tags: tags.length ? tags : null,
        })
      } else {
        await saveTemplate.mutateAsync({
          name: name.trim(),
          description: description.trim() || null,
          phase: phaseChar,
          artifact_code: artifactCode.trim() || null,
          prompt_template: promptTemplate.trim(),
          tags: tags.length ? tags : null,
        })
      }
      onSaved?.()
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler beim Speichern.'
      setError(msg)
    }
  }

  if (!open) return null

  const body = (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-form-title"
    >
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-border bg-surface2 flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 id="template-form-title" className="text-lg font-bold text-text">
              {isEdit ? 'Template bearbeiten' : 'Neues Template anlegen'}
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {isEdit ? 'Vorlage in der Bibliothek aktualisieren' : 'Neue Vorlage für Artefakte erstellen'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-border bg-surface text-muted hover:bg-surface-2 hover:text-text flex items-center justify-center"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {error && (
              <p className="text-sm text-red bg-red/10 py-2 px-3 rounded-lg" role="alert">
                {error}
              </p>
            )}

            <section>
              <h3 className="text-sm font-semibold text-text mb-3">Grunddaten</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Name <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Konkurrenzanalyse Phase A"
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Beschreibung</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Wofür dieses Template nützlich ist…"
                    rows={2}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-y"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Phase</label>
                    <select
                      value={phase}
                      onChange={(e) => setPhase(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {PHASES.map((p) => (
                        <option key={p} value={p}>
                          Phase {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Artefakt-Kennung (optional)</label>
                    <input
                      type="text"
                      value={artifactCode}
                      onChange={(e) => setArtifactCode(e.target.value)}
                      placeholder="z.B. A1, B2.1"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Prompt-Template <span className="text-red">*</span>
              </label>
              <textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder="Das Prompt, das für dieses Artefakt verwendet wird. Platzhalter z.B. [KATEGORIE], [INPUT A]…"
                rows={8}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm font-mono text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-y min-h-[120px]"
                required
              />
            </section>

            <section>
              <h3 className="text-sm font-semibold text-text mb-2">Tags (optional)</h3>
              <TagInput tags={tags} onChange={setTags} placeholder="Tag hinzufügen…" />
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags((prev) => [...prev, t])}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-surface text-text-secondary hover:border-accent hover:bg-accent-light hover:text-accent"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="p-5 border-t border-border flex justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-2 text-sm font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saveTemplate.isPending || updateTemplate.isPending}
              className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-[#4a6fef] disabled:opacity-50"
            >
              {saveTemplate.isPending || updateTemplate.isPending
                ? 'Wird gespeichert…'
                : isEdit
                  ? 'Speichern'
                  : 'Template anlegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(body, document.body)
}
