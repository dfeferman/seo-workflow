import type { ArtifactPhase } from '@/types/database.types'

/**
 * Definiert welche Phasen-Outputs als Input in einer bestimmten Phase verfügbar sein sollen.
 * Basiert auf docs/IO_Mapping_Agent.md.
 *
 * Phase A: kein Vorgänger
 * Phase B: benötigt OUTPUT_A
 * Phase C: benötigt OUTPUT_A, OUTPUT_B
 * Phase D: benötigt OUTPUT_B (Links), OUTPUT_C (Briefing)
 * Phase E: benötigt OUTPUT_D (Text Erstentwurf)
 * Phase F: benötigt OUTPUT_A (Sources), OUTPUT_C (Briefing), OUTPUT_D/OUTPUT_E (Text)
 */
export const PHASE_OUTPUT_DEPENDENCIES: Readonly<Record<ArtifactPhase, ArtifactPhase[]>> = {
  A: [],
  B: ['A'],
  C: ['A', 'B'],
  D: ['B', 'C'],
  E: ['D'],
  F: ['A', 'C', 'D', 'E'],
  G: [],
  X: [],
}

/**
 * Gibt die Phasen zurück, deren Outputs in der angegebenen Phase als [OUTPUT_X]-Placeholder
 * verfügbar sind.
 */
export function getInputPhasesFor(phase: ArtifactPhase): ArtifactPhase[] {
  return PHASE_OUTPUT_DEPENDENCIES[phase] ?? []
}
