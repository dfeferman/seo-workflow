import { describe, it, expect } from 'vitest'
import { replacePlaceholders } from './replacePlaceholders'
import type { CategoryRow } from '@/types/database.types'

function category(overrides: Partial<CategoryRow> = {}): CategoryRow {
  return {
    id: 'cat-1',
    project_id: 'proj-1',
    parent_id: null,
    name: 'Testkategorie',
    type: 'category',
    hub_name: null,
    zielgruppen: ['B2B', 'B2C'],
    shop_typ: 'Fashion',
    usps: 'Schnell, günstig',
    ton: 'Freundlich',
    no_gos: 'Keine Duplicate Content',
    display_order: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('replacePlaceholders', () => {
  it('gibt Template unverändert zurück bei null-Kategorie und leerem Template', () => {
    expect(replacePlaceholders('', null)).toBe('')
  })

  it('ersetzt [KATEGORIE] durch Kategoriename', () => {
    const cat = category({ name: 'Elektronik' })
    expect(replacePlaceholders('Kategorie: [KATEGORIE].', cat)).toBe('Kategorie: Elektronik.')
  })

  it('ersetzt [ZIELGRUPPEN] als kommaseparierte Liste', () => {
    const cat = category({ zielgruppen: ['A', 'B'] })
    expect(replacePlaceholders('[ZIELGRUPPEN]', cat)).toBe('A, B')
  })

  it('behält [ZIELGRUPPEN] bei leerem Array', () => {
    const cat = category({ zielgruppen: [] })
    expect(replacePlaceholders('[ZIELGRUPPEN]', cat)).toBe('[ZIELGRUPPEN]')
  })

  it('ersetzt mehrere Platzhalter', () => {
    const cat = category({
      name: 'Shop',
      usps: 'USP1',
      ton: 'Formal',
    })
    const template = '[KATEGORIE] · [USPs] · [TON]'
    expect(replacePlaceholders(template, cat)).toBe('Shop · USP1 · Formal')
  })

  it('nutzt dependencyMap für zusätzliche Platzhalter', () => {
    const cat = category({ name: 'K1' })
    const deps = { '[INPUT A]': 'Eingabe 1', '[BRIEFING]': 'Briefing-Text' }
    expect(
      replacePlaceholders('Kategorie: [KATEGORIE]. Input: [INPUT A]. [BRIEFING]', cat, deps)
    ).toBe('Kategorie: K1. Input: Eingabe 1. Briefing-Text')
  })

  it('merged dependencyMap mit Kategorie-Ersetzungen', () => {
    const cat = category({ name: 'K1' })
    const deps = { '[KATEGORIE]': 'Überschrieben' }
    expect(replacePlaceholders('[KATEGORIE]', cat, deps)).toBe('Überschrieben')
  })

  it('behandelt null/undefined dependencyMap', () => {
    const cat = category({ name: 'K1' })
    expect(replacePlaceholders('[KATEGORIE]', cat, null)).toBe('K1')
    expect(replacePlaceholders('[KATEGORIE]', cat, undefined)).toBe('K1')
  })
})
