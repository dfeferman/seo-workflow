import { describe, it, expect } from 'vitest'
import { buildDependencyMap, applyPhaseOutputOverrides } from './usePlaceholderData'
import type { ArtifactRow } from '@/types/database.types'

function makeArtifact(
  id: string,
  code: string,
  phase: string,
  order: number
): ArtifactRow {
  return {
    id,
    category_id: 'cat-1',
    artifact_code: code,
    phase: phase as ArtifactRow['phase'],
    name: code,
    description: null,
    prompt_template: '',
    recommended_source: null,
    estimated_duration_minutes: null,
    display_order: order,
    created_at: '',
    updated_at: '',
    template_id: null,
  }
}

describe('buildDependencyMap', () => {
  it('setzt kein [INPUT A] aus Phase-A-Artefakten (nur per-code)', () => {
    const artifacts = [
      makeArtifact('a1', 'A1', 'A', 0),
      makeArtifact('a2', 'A2', 'A', 1),
    ]
    const results = new Map([['a1', 'SERP-Analyse'], ['a2', 'Quellen']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[INPUT A]']).toBeUndefined()
    expect(map['[INPUT A1]']).toBe('SERP-Analyse')
    expect(map['[INPUT A2]']).toBe('Quellen')
  })

  it('baut [INPUT <code>] für einzelne Artefakte', () => {
    const artifacts = [makeArtifact('a1', 'A1', 'A', 0)]
    const results = new Map([['a1', 'SERP-Text']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[INPUT A1]']).toBe('SERP-Text')
  })

  it('setzt kein [INPUT A] wenn keine Ergebnisse (nur per-code leer)', () => {
    const artifacts = [makeArtifact('a1', 'A1', 'A', 0)]
    const results = new Map<string, string>()
    const map = buildDependencyMap(artifacts, results)
    expect(map['[INPUT A]']).toBeUndefined()
    expect(map['[INPUT A1]']).toBeUndefined()
  })

  it('mappt [BRIEFING] von C1', () => {
    const artifacts = [makeArtifact('c1', 'C1', 'C', 0)]
    const results = new Map([['c1', 'Briefing-Text']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[BRIEFING]']).toBe('Briefing-Text')
  })

  it('mappt [TEXT] von D1', () => {
    const artifacts = [makeArtifact('d1', 'D1', 'D', 0)]
    const results = new Map([['d1', 'Entwurf-Text']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[TEXT]']).toBe('Entwurf-Text')
  })

  it('mappt [LINKS] von B2', () => {
    const artifacts = [makeArtifact('b2', 'B2', 'B', 0)]
    const results = new Map([['b2', 'Interlinking-Plan']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[LINKS]']).toBe('Interlinking-Plan')
  })

  it('mappt [LINKS] von B2.1 wenn B2 fehlt', () => {
    const artifacts = [makeArtifact('b21', 'B2.1', 'B', 0)]
    const results = new Map([['b21', 'Interlinking-Details']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[LINKS]']).toBe('Interlinking-Details')
  })

  it('bevorzugt B2 über B2.1 für [LINKS]', () => {
    const artifacts = [
      makeArtifact('b2', 'B2', 'B', 0),
      makeArtifact('b21', 'B2.1', 'B', 1),
    ]
    const results = new Map([['b2', 'Plan'], ['b21', 'Details']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[LINKS]']).toBe('Plan')
  })

  it('setzt kein [INPUT B] aus mehreren Phase-B-Artefakten (nur per-code)', () => {
    const artifacts = [
      makeArtifact('b1', 'B1', 'B', 0),
      makeArtifact('b2', 'B2', 'B', 1),
    ]
    const results = new Map([['b1', 'Mapping'], ['b2', 'Interlinking']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[INPUT B]']).toBeUndefined()
    expect(map['[INPUT B1]']).toBe('Mapping')
    expect(map['[INPUT B2]']).toBe('Interlinking')
  })

  it('überspringt Artefakte ohne Ergebnis; [INPUT A] fehlt', () => {
    const artifacts = [
      makeArtifact('a1', 'A1', 'A', 0),
      makeArtifact('a2', 'A2', 'A', 1),
    ]
    const results = new Map([['a1', 'Nur A1']])
    const map = buildDependencyMap(artifacts, results)
    expect(map['[INPUT A]']).toBeUndefined()
    expect(map['[INPUT A1]']).toBe('Nur A1')
  })
})

describe('applyPhaseOutputOverrides', () => {
  it('leert [INPUT A] und entfernt [INPUT A1] wenn kein Phase-Output für A', () => {
    const artifacts = [makeArtifact('a1', 'A1', 'A', 0)]
    const map = buildDependencyMap(artifacts, new Map([['a1', 'SERP-Analyse']]))
    expect(map['[INPUT A]']).toBeUndefined()
    expect(map['[INPUT A1]']).toBe('SERP-Analyse')
    applyPhaseOutputOverrides(map, [], artifacts)
    expect(map['[INPUT A]']).toBe('')
    expect(map['[INPUT A1]']).toBeUndefined()
  })

  it('leert [INPUT B], [INPUT B1] und [BRIEFING]/[TEXT] wenn keine Phase-Outputs', () => {
    const artifacts = [
      makeArtifact('b1', 'B1', 'B', 0),
      makeArtifact('c1', 'C1', 'C', 0),
    ]
    const map = buildDependencyMap(artifacts, new Map([['b1', 'Mapping'], ['c1', 'Briefing']]))
    applyPhaseOutputOverrides(map, [], artifacts)
    expect(map['[INPUT B]']).toBe('')
    expect(map['[INPUT B1]']).toBeUndefined()
    expect(map['[BRIEFING]']).toBe('')
    expect(map['[TEXT]']).toBe('')
  })

  it('setzt [INPUT A] nur aus category_phase_outputs (nicht aus Artefakt-Join)', () => {
    const artifacts = [makeArtifact('a1', 'A1', 'A', 0)]
    const map = buildDependencyMap(artifacts, new Map([['a1', 'Altes Ergebnis']]))
    expect(map['[INPUT A]']).toBeUndefined()
    expect(map['[INPUT A1]']).toBe('Altes Ergebnis')
    applyPhaseOutputOverrides(
      map,
      [{ phase: 'A', output_text: 'Kompilierter Phase-A-Output' }],
      artifacts
    )
    expect(map['[INPUT A]']).toBe('Kompilierter Phase-A-Output')
    expect(map['[INPUT A1]']).toBe('Altes Ergebnis')
  })

  it('entfernt [LINKS] wenn kein Phase-Output für B', () => {
    const artifacts = [makeArtifact('b2', 'B2', 'B', 0)]
    const map = buildDependencyMap(artifacts, new Map([['b2', 'Plan']]))
    expect(map['[LINKS]']).toBe('Plan')
    applyPhaseOutputOverrides(map, [], artifacts)
    expect(map['[LINKS]']).toBeUndefined()
  })

  it('setzt [BRIEFING] aus Phase C Output', () => {
    const map: Record<string, string> = {}
    applyPhaseOutputOverrides(
      map,
      [
        { phase: 'C', output_text: 'C-Output' },
      ],
      []
    )
    expect(map['[INPUT C]']).toBe('C-Output')
    expect(map['[BRIEFING]']).toBe('C-Output')
  })
})
