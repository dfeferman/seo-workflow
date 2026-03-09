import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSaveTemplate } from '@/hooks/useSaveTemplate'
import type { ArtifactRow } from '@/types/database.types'

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

const SUGGESTED_TAGS = ['SEO', 'Analyse', 'Content', 'Recherche', 'Briefing', 'Meta', 'E-E-A-T']

type Props = {
  open: boolean
  onClose: () => void
  artifact: ArtifactRow | null
  onSaved?: () => void
}

function TagInput({
  tags,
  onChange,
  placeholder = 'Tag hinzufügen…',
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = useCallback(() => {
    const t = input.trim()
    if (t && !tags.includes(t)) {
      onChange([...tags, t])
      setInput('')
    }
  }, [input, tags, onChange])

  return (
    <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-accent">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-accent rounded text-xs text-blue-600"
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
        className="flex-1 min-w-[100px] bg-transparent border-none py-1 px-1 text-sm text-slate-900 outline-none placeholder:text-slate-500"
      />
    </div>
  )
}

export function SaveTemplateModal({ open, onClose, artifact, onSaved }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [includePrompt, setIncludePrompt] = useState(true)
  const [success, setSuccess] = useState(false)

  const saveTemplate = useSaveTemplate()

  useEffect(() => {
    if (open && artifact) {
      setName(artifact.name)
      setDescription(artifact.description ?? '')
      setTags([])
      setIncludePrompt(true)
      setSuccess(false)
    }
  }, [open, artifact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!artifact || !name.trim()) return
    try {
      await saveTemplate.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        phase: artifact.phase,
        artifact_code: artifact.artifact_code ?? null,
        prompt_template: includePrompt ? artifact.prompt_template : '(Prompt nicht übernommen)',
        tags: tags.length ? tags : null,
      })
      setSuccess(true)
      onSaved?.()
    } catch {
      // Error shown via mutation
    }
  }

  if (!open) return null

  const phase = artifact?.phase?.toUpperCase() ?? 'A'
  const badgeClass = PHASE_BADGE_CLASS[phase] ?? PHASE_BADGE_CLASS.F

  const modalBody = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-green/5 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="w-10 h-10 rounded-xl bg-green flex items-center justify-center text-xl text-white shadow-sm">
              💾
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
          <h2 id="save-template-title" className="text-lg font-bold text-slate-900">Als Template speichern</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dieses Artefakt für zukünftige Projekte wiederverwendbar machen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {artifact && (
              <>
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                    👁 Aktuelles Artefakt
                  </h3>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono ${badgeClass}`}
                      >
                        {artifact.artifact_code || artifact.phase}
                      </div>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">{artifact.name}</div>
                    {artifact.description && (
                      <div className="text-xs text-slate-500 mt-1">{artifact.description}</div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                    📝 Template-Informationen
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">
                        Template-Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="z.B. Meine Konkurrenzanalyse"
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-2xs text-slate-500 mt-1">Wird in der Template-Bibliothek angezeigt</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">
                        Beschreibung
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Wofür dieses Template nützlich ist…"
                        rows={3}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                    🏷️ Tags (optional)
                  </h3>
                  <TagInput tags={tags} onChange={setTags} placeholder="Tag hinzufügen…" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTags((prev) => [...prev, t])}
                        className="px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:border-accent hover:bg-indigo-50 hover:text-blue-600"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="bg-green/10 border border-green/30 rounded-lg p-3 flex gap-2.5 text-sm text-slate-600">
                  <span className="text-lg">💡</span>
                  <p>
                    <strong className="text-green">Tipp:</strong> Gespeicherte Templates erscheinen in
                    deiner Template-Bibliothek und können jederzeit wiederverwendet werden.
                  </p>
                </div>

                {saveTemplate.error && (
                  <p className="text-sm text-red-600">
                    {saveTemplate.error instanceof Error ? saveTemplate.error.message : 'Fehler beim Speichern.'}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-100 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePrompt}
                onChange={(e) => setIncludePrompt(e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Prompt-Template einschließen</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:text-slate-900"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!name.trim() || saveTemplate.isPending}
                className="px-4 py-2.5 rounded-lg bg-green text-white text-sm font-semibold shadow-sm hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveTemplate.isPending ? 'Speichern…' : '💾 Template speichern'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  const successOverlay = success && (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-xl animate-[slideUp_0.3s_ease]">
        <div
          className="w-16 h-16 mx-auto mb-5 rounded-full bg-green/20 flex items-center justify-center text-3xl text-green"
          style={{ animation: 'scaleIn 0.4s ease' }}
        >
          ✓
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Template erfolgreich gespeichert!</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Dein Template „{name}" steht jetzt in der Template-Bibliothek zur Verfügung.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false)
            onClose()
          }}
          className="px-5 py-2.5 rounded-lg bg-green text-white text-sm font-semibold hover:bg-[#059669]"
        >
          Schließen
        </button>
      </div>
    </div>
  )

  return createPortal(
    <>
      {modalBody}
      {successOverlay}
    </>,
    document.body
  )
}
