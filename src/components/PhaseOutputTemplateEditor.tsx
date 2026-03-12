import { useState, useEffect } from 'react'
import { usePhaseOutputTemplates } from '@/hooks/usePhaseOutputTemplates'
import { useSavePhaseOutputTemplate } from '@/hooks/useSavePhaseOutputTemplate'
import type { ArtifactPhase, PhaseOutputTemplateRow } from '@/types/database.types'

const PHASES: ArtifactPhase[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X']

const PHASE_DESCRIPTIONS: Record<ArtifactPhase, string> = {
  A: 'Setup, SERP-Analyse, Quellen, FAQ-Pool, Keyword-Daten',
  B: 'Mapping & Interlinking',
  C: 'Content-Briefing',
  D: 'Textproduktion',
  E: 'SurferSEO-Optimierung',
  F: 'YMYL-QA & Freigabe',
  G: 'Erweitert',
  X: 'Sonstiges',
}

const PHASE_HINTS: Record<ArtifactPhase, string> = {
  A: 'Verfügbare Codes: [A1], [A2.1], [A3], [A4] – werden mit den Artefakt-Ergebnissen ersetzt.',
  B: 'Verfügbare Codes: [B1], [B2], [B2.1]',
  C: 'Verfügbare Codes: [C1], [C2], [C3]',
  D: 'Verfügbare Codes: [D1], [D2], [D3], [D4], [D5]',
  E: 'Verfügbare Codes: [E1], [E2]',
  F: 'Verfügbare Codes: [F1], [F2], [F3], [F4], [F5]',
  G: 'Verfügbare Codes: je nach eigenen Artefakten.',
  X: 'Verfügbare Codes: je nach eigenen Artefakten.',
}

type PhaseEditorRowProps = {
  phase: ArtifactPhase
  existing: PhaseOutputTemplateRow | undefined
}

function PhaseEditorRow({ phase, existing }: PhaseEditorRowProps) {
  const [text, setText] = useState(existing?.template_text ?? '')
  const [saved, setSaved] = useState(false)
  const saveTemplate = useSavePhaseOutputTemplate()

  // Sync when external data loads
  useEffect(() => {
    setText(existing?.template_text ?? '')
  }, [existing?.template_text])

  const isDirty = text !== (existing?.template_text ?? '')

  const handleSave = async () => {
    await saveTemplate.mutateAsync({ phase, template_text: text })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold font-sans">
            {phase}
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-900">Phase {phase}</div>
            <div className="text-xs text-slate-500">{PHASE_DESCRIPTIONS[phase]}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existing?.template_text && (
            <span className="text-2xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
              Template vorhanden
            </span>
          )}
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveTemplate.isPending}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saveTemplate.isPending ? 'Speichern…' : saved ? '✓ Gespeichert' : 'Speichern'}
            </button>
          )}
          {!isDirty && saved && (
            <span className="text-xs font-medium text-green-700">✓ Gespeichert</span>
          )}
        </div>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-2xs text-slate-500">{PHASE_HINTS[phase]}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`## Phase ${phase} Output\n\n[${phase}1]\n\n[${phase}2]`}
          rows={6}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y min-h-[130px]"
        />
        {saveTemplate.isError && (
          <p className="text-xs text-red-600" role="alert">
            Fehler beim Speichern: {saveTemplate.error?.message}
          </p>
        )}
      </div>
    </div>
  )
}

export function PhaseOutputTemplateEditor() {
  const { data: templates = [], isLoading } = usePhaseOutputTemplates()
  const templateByPhase = Object.fromEntries(
    templates.map((t) => [t.phase, t])
  ) as Partial<Record<ArtifactPhase, PhaseOutputTemplateRow>>

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">Templates werden geladen…</div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <p className="text-sm text-blue-800 font-medium mb-1">Globale Phase-Output-Templates</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          Hier definiertst du einmalig, wie der Output jeder Phase strukturiert sein soll.
          Diese Vorlagen gelten für alle Kategorien. Platzhalter wie <code className="bg-blue-100 px-1 rounded font-mono">[A1]</code> werden
          beim Generieren mit dem jeweiligen Artefakt-Ergebnis befüllt.
        </p>
      </div>
      {PHASES.map((phase) => (
        <PhaseEditorRow
          key={phase}
          phase={phase}
          existing={templateByPhase[phase]}
        />
      ))}
    </div>
  )
}
