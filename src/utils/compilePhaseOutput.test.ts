import { describe, it, expect } from 'vitest'
import { compilePhaseOutput } from './compilePhaseOutput'

describe('compilePhaseOutput', () => {
  it('gibt leeren String zurück bei leerem Template', () => {
    expect(compilePhaseOutput('', new Map())).toBe('')
  })

  it('ersetzt einen einzelnen Artefakt-Platzhalter', () => {
    const results = new Map([['A1', 'SERP-Analyse Ergebnis']])
    expect(compilePhaseOutput('## Analyse\n[A1]', results)).toBe('## Analyse\nSERP-Analyse Ergebnis')
  })

  it('ersetzt mehrere Artefakt-Platzhalter', () => {
    const results = new Map([
      ['A1', 'Ergebnis A1'],
      ['A2.1', 'Ergebnis A2.1'],
    ])
    const template = '[A1]\n\n[A2.1]'
    expect(compilePhaseOutput(template, results)).toBe('Ergebnis A1\n\nErgebnis A2.1')
  })

  it('lässt unbekannte Platzhalter unverändert', () => {
    const results = new Map([['A1', 'Ergebnis A1']])
    expect(compilePhaseOutput('[A1] [A99]', results)).toBe('Ergebnis A1 [A99]')
  })

  it('lässt Platzhalter stehen wenn kein Ergebnis vorhanden', () => {
    expect(compilePhaseOutput('[A1]', new Map())).toBe('[A1]')
  })

  it('ersetzt denselben Platzhalter mehrfach', () => {
    const results = new Map([['B1', 'Mapping']])
    expect(compilePhaseOutput('[B1] und nochmals [B1]', results)).toBe('Mapping und nochmals Mapping')
  })

  it('behandelt Platzhalter mit Punkt (z.B. A2.1, B2.1)', () => {
    const results = new Map([['B2.1', 'Interlinking-Plan']])
    expect(compilePhaseOutput('Plan: [B2.1]', results)).toBe('Plan: Interlinking-Plan')
  })

  it('trimmt Result-Text nicht weg (bewahrt Whitespace)', () => {
    const results = new Map([['A1', '  Ergebnis mit Leerzeichen  ']])
    expect(compilePhaseOutput('[A1]', results)).toBe('  Ergebnis mit Leerzeichen  ')
  })

  it('gibt Template unverändert zurück wenn Map leer ist', () => {
    const template = '## Phase A\n[A1]\n[A2.1]\n[A3]'
    expect(compilePhaseOutput(template, new Map())).toBe(template)
  })
})
