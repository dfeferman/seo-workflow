import { useState } from 'react'
import { useCategoryPhaseOutput } from '@/hooks/useCategoryPhaseOutput'
import { getInputPhasesFor } from '@/utils/phaseOutputDependencies'
import type { ArtifactPhase } from '@/types/database.types'

const PREVIEW_LENGTH = 180

type PhaseReferenceRowProps = {
  categoryId: string
  phase: ArtifactPhase
}

function PhaseReferenceRow({ categoryId, phase }: PhaseReferenceRowProps) {
  const [expanded, setExpanded] = useState(false)
  const { data: phaseOutput, isLoading } = useCategoryPhaseOutput(categoryId, phase)

  const outputText = phaseOutput?.output_text ?? ''
  const hasOutput = outputText.length > 0
  const isTruncated = outputText.length > PREVIEW_LENGTH
  const displayText = expanded || !isTruncated ? outputText : outputText.slice(0, PREVIEW_LENGTH)

  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-2xs font-bold bg-slate-700 text-white">
            {phase}
          </span>
          <span className="font-medium text-slate-600">[INPUT {phase}]</span>
          {hasOutput ? (
            <span className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-2xs font-medium">
              vorhanden
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-2xs font-medium">
              fehlt
            </span>
          )}
        </div>
        <span className="text-slate-400 text-2xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-3 border-t border-slate-100 bg-white">
          {isLoading ? (
            <p className="text-slate-500 italic">Laden…</p>
          ) : hasOutput ? (
            <>
              <pre className="whitespace-pre-wrap font-sans text-slate-600 leading-relaxed">
                {displayText}
                {isTruncated && !expanded && '…'}
              </pre>
              {isTruncated && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
                  className="mt-1 text-slate-400 hover:text-slate-600 underline underline-offset-2"
                >
                  Mehr anzeigen
                </button>
              )}
            </>
          ) : (
            <p className="text-slate-400 italic">
              Noch kein Output für Phase {phase} generiert. Phase abschließen → „Output generieren" klicken.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

type Props = {
  phase: ArtifactPhase
  categoryId: string
}

/**
 * Zeigt die Vorgänger-Phase-Outputs die als [INPUT X]-Platzhalter in diesem Artefakt
 * verfügbar sind. Nur sichtbar wenn Vorgänger-Phasen existieren (z.B. Phase A hat keine).
 */
export function PhaseInputReference({ phase, categoryId }: Props) {
  const inputPhases = getInputPhasesFor(phase)
  if (inputPhases.length === 0) return null

  return (
    <section>
      <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
        Phase-Inputs
      </span>
      <div className="space-y-1.5">
        {inputPhases.map((p) => (
          <PhaseReferenceRow key={p} categoryId={categoryId} phase={p} />
        ))}
      </div>
    </section>
  )
}
