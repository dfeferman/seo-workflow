import type { ArtifactPhase } from '@/types/database.types'

const PHASES: { phase: ArtifactPhase; label: string }[] = [
  { phase: 'A', label: 'Recherche' },
  { phase: 'B', label: 'Mapping' },
  { phase: 'C', label: 'Briefing' },
  { phase: 'D', label: 'Schreiben' },
  { phase: 'E', label: 'SEO' },
  { phase: 'F', label: 'QA' },
  { phase: 'G', label: 'Sonstige' },
  { phase: 'X', label: 'Extra' },
]

const BADGE_CLASS: Record<string, string> = {
  A: 'bg-[#f3e8ff] text-[#7c3aed]',
  B: 'bg-[#dbeafe] text-[#2563eb]',
  C: 'bg-[#fef3c7] text-[#d97706]',
  D: 'bg-[#d1fae5] text-[#059669]',
  E: 'bg-[#fee2e2] text-[#dc2626]',
  F: 'bg-[#f3f4f6] text-[#6b7280]',
  G: 'bg-[#f3f4f6] text-[#6b7280]',
  X: 'bg-[#f3f4f6] text-[#6b7280]',
}

type PhaseSelectorProps = {
  value: ArtifactPhase | null
  onChange: (phase: ArtifactPhase) => void
}

export function PhaseSelector({ value, onChange }: PhaseSelectorProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
      {PHASES.map(({ phase, label }) => (
        <button
          key={phase}
          type="button"
          onClick={() => onChange(phase)}
          className={`p-3 rounded-lg border-2 text-center transition-all ${
            value === phase
              ? 'border-accent bg-indigo-50'
              : 'border-slate-200 bg-white hover:border-[#d0d4d8] hover:bg-slate-100'
          }`}
        >
          <div
            className={`w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center text-sm font-bold font-mono ${
              BADGE_CLASS[phase] ?? BADGE_CLASS.F
            } ${value === phase ? 'scale-110' : ''}`}
          >
            {phase}
          </div>
          <div
            className={`text-2xs font-semibold ${
              value === phase ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            {label}
          </div>
        </button>
      ))}
    </div>
  )
}
