import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PhaseSelector } from '@/components/PhaseSelector'
import { PromptEditor } from '@/components/PromptEditor'
import type { CategoryRow } from '@/types/database.types'
import type { ArtifactPhase } from '@/types/database.types'
import { useArtifacts } from '@/hooks/useArtifacts'
import type { TemplateRow } from '@/types/database.types'

const SOURCE_OPTIONS = [
  { value: '', label: 'Keine Angabe' },
  { value: 'perplexity', label: 'Perplexity (Recherche)' },
  { value: 'chatgpt', label: 'ChatGPT (Textgenerierung)' },
  { value: 'claude', label: 'Claude (Analyse)' },
  { value: 'manual', label: 'Manuell' },
]

type Props = {
  open: boolean
  onClose: () => void
  categoryId: string
  projectId: string
  category: CategoryRow | null
  /** Beim Öffnen aus der Template-Bibliothek: Vorlage zum Vorausfüllen */
  initialFromTemplate?: TemplateRow | null
}

export function CreateArtifactWizard({
  open,
  onClose,
  categoryId,
  projectId,
  category,
  initialFromTemplate,
}: Props) {
  const queryClient = useQueryClient()
  const { data: artifacts = [] } = useArtifacts(categoryId)

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [artifactCode, setArtifactCode] = useState('')
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<ArtifactPhase | null>(null)
  const [promptTemplate, setPromptTemplate] = useState('')
  const [recommendedSource, setRecommendedSource] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(20)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStep(1)
      setName('')
      setArtifactCode('')
      setDescription('')
      setPhase(null)
      setPromptTemplate('')
      setRecommendedSource('')
      setEstimatedMinutes(20)
      setError(null)
    } else if (initialFromTemplate) {
      const t = initialFromTemplate
      setName(t.name)
      setArtifactCode(t.artifact_code ?? '')
      setDescription(t.description ?? '')
      setPhase((t.phase?.toUpperCase() ?? 'A') as ArtifactPhase)
      setPromptTemplate(t.prompt_template ?? '')
    }
  }, [open, initialFromTemplate])

  const nextDisplayOrder = artifacts.length

  const canStep2 = name.trim() && artifactCode.trim() && phase != null
  const canSubmit =
    name.trim() &&
    artifactCode.trim() &&
    phase != null &&
    promptTemplate.trim()

  const handleSubmit = async () => {
    if (!canSubmit || !categoryId) return
    setError(null)
    setIsSubmitting(true)
    try {
      const { error: err } = await supabase.from('artifacts').insert({
        category_id: categoryId,
        phase: phase!,
        artifact_code: artifactCode.trim(),
        name: name.trim(),
        description: description.trim() || null,
        prompt_template: promptTemplate.trim(),
        recommended_source: recommendedSource || null,
        estimated_duration_minutes: estimatedMinutes ?? null,
        display_order: nextDisplayOrder,
      })
      if (err) throw err
      queryClient.invalidateQueries({ queryKey: ['artifacts', categoryId] })
      queryClient.invalidateQueries({ queryKey: ['artifact-status-map', categoryId] })
      queryClient.invalidateQueries({ queryKey: ['category-progress', projectId] })
      onClose()
    } catch (e) {
      const rawMessage =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e != null && 'message' in e && typeof (e as { message: unknown }).message === 'string'
            ? (e as { message: string }).message
            : ''
      const message = rawMessage || 'Fehler beim Anlegen.'
      // Verständliche Meldung bei doppeltem Artefakt-Code (UNIQUE category_id + artifact_code)
      const friendlyMessage =
        /unique|duplicate|already exists/i.test(message)
          ? `Ein Artefakt mit der Kennung „${artifactCode.trim()}“ existiert in dieser Kategorie bereits. Bitte andere Phase/Kennung wählen.`
          : message
      setError(friendlyMessage)
      if (process.env.NODE_ENV === 'development') console.error('Artefakt anlegen:', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  const steps = [
    { num: 1, label: 'Basis' },
    { num: 2, label: 'Prompt' },
    { num: 3, label: 'Details' },
  ]

  const body = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Neues Artefakt anlegen"
    >
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 pb-0 flex-shrink-0 border-b border-border bg-surface2">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-xl text-white shadow-sm">
              ✨
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-border bg-surface text-muted hover:bg-surface-2 hover:text-text flex items-center justify-center"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
          <h2 className="text-xl font-bold text-text">Neues Artefakt anlegen</h2>
          <p className="text-sm text-muted mt-1">
            Erstelle ein benutzerdefiniertes Artefakt für deinen Workflow
          </p>

          <div className="flex items-center gap-2 mt-6 pb-5 border-b border-border">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step > s.num
                      ? 'bg-green border-green text-white'
                      : step === s.num
                        ? 'bg-accent border-accent text-white'
                        : 'bg-surface2 border-border text-muted'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`text-xs font-medium ${
                    step === s.num ? 'text-accent' : step > s.num ? 'text-green' : 'text-muted'
                  }`}
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-border mx-1 min-w-[20px]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {step === 1 && (
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-3">
                  📋 Grundinformationen
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Artefakt-Name <span className="text-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="z.B. Konkurrenzanalyse"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <p className="text-2xs text-muted mt-1">Beschreibender Name für dieses Artefakt</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Artefakt-Code <span className="text-red">*</span>
                      <span className="ml-2 text-2xs text-muted font-mono font-normal">
                        Eindeutig in der Kategorie
                      </span>
                    </label>
                    <input
                      type="text"
                      value={artifactCode}
                      onChange={(e) => setArtifactCode(e.target.value)}
                      placeholder="z.B. A4 oder B2.2"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm font-mono text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <p className="text-2xs text-muted mt-1">Alphanumerischer Code (z.B. G1, X1.2)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Kurzbeschreibung
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="z.B. Wettbewerber identifizieren & analysieren"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-3">
                  🎯 Phase zuordnen
                </h3>
                <PhaseSelector value={phase} onChange={setPhase} />
                <p className="text-xs text-muted mt-3 flex items-center gap-2">
                  💡 Du kannst auch G (Sonstige) oder X (Extra) wählen.
                </p>
              </section>
            </div>
          )}

          {step === 2 && (
            <section>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
                ✍️ Prompt-Template
              </h3>
              <PromptEditor
                value={promptTemplate}
                onChange={setPromptTemplate}
                category={category}
                categoryId={categoryId}
              />
            </section>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-3">
                  ⚙️ Zusätzliche Optionen
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Empfohlene Quelle
                    </label>
                    <select
                      value={recommendedSource}
                      onChange={(e) => setRecommendedSource(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {SOURCE_OPTIONS.map((o) => (
                        <option key={o.value || 'none'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-2xs text-muted mt-1">Optional: Welches Tool soll verwendet werden?</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Geschätzte Dauer (Minuten)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={estimatedMinutes ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setEstimatedMinutes(v === '' ? null : parseInt(v, 10) || null)
                      }}
                      placeholder="z.B. 20"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <p className="text-2xs text-muted mt-1">Hilft bei der Zeitplanung</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red">{error}</p>
          )}
        </div>

        <div className="p-5 border-t border-border bg-surface2 flex justify-between items-center gap-4 flex-shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-lg border border-border bg-surface text-text-secondary text-sm font-semibold hover:bg-surface-2 hover:text-text"
              >
                ← Zurück
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border bg-surface text-text-secondary text-sm font-semibold hover:bg-surface-2 hover:text-text"
            >
              Abbrechen
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !canStep2}
                className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4a6fef]"
              >
                Weiter →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4a6fef]"
              >
                {isSubmitting ? 'Wird angelegt…' : '✓ Artefakt anlegen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(body, document.body)
}
