import { describe, it, expect } from 'vitest'
import {
  buildArtifactsFromTemplates,
  getDefaultArtifactsForCategory,
  CATEGORY_DEFAULT_ARTIFACTS,
  BLOG_DEFAULT_ARTIFACTS,
} from './createDefaultArtifacts'
import type { TemplateRow } from '@/types/database.types'

function template(overrides: Partial<TemplateRow> = {}): TemplateRow {
  return {
    id: 't-1',
    user_id: 'u-1',
    name: 'Template 1',
    description: null,
    phase: 'A',
    artifact_code: 'A1',
    prompt_template: 'Prompt für [KATEGORIE].',
    tags: null,
    usage_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('createDefaultArtifacts', () => {
  describe('buildArtifactsFromTemplates', () => {
    const categoryId = 'cat-abc'

    it('gibt leeres Array bei leerer Template-Liste', () => {
      expect(buildArtifactsFromTemplates([], categoryId)).toEqual([])
    })

    it('gibt ein Artefakt pro gültigem Template mit category_id und display_order', () => {
      const templates = [template({ phase: 'B', artifact_code: 'B1', name: 'Recherche' })]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        category_id: categoryId,
        phase: 'B',
        artifact_code: 'B1',
        name: 'Recherche',
        prompt_template: 'Prompt für [KATEGORIE].',
        display_order: 0,
      })
    })

    it('filtert Templates mit ungültiger Phase aus', () => {
      const templates = [
        template({ phase: 'A' }),
        template({ phase: 'Z', id: 't-z' }),
        template({ phase: '', id: 't-empty' }),
      ]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result).toHaveLength(1)
      expect(result[0].phase).toBe('A')
    })

    it('normalisiert Phase zu Großbuchstaben', () => {
      const templates = [template({ phase: 'c', artifact_code: 'C1' })]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result[0].phase).toBe('C')
    })

    it('verwendet Fallback artifact_code wenn artifact_code leer oder null', () => {
      const templates = [
        template({ phase: 'A', artifact_code: null }),
        template({ phase: 'A', artifact_code: '  ', id: 't-2' }),
      ]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result[0].artifact_code).toBe('A-1')
      expect(result[1].artifact_code).toBe('A-2')
    })

    it('verwendet Fallback name "Unbenannt" wenn name leer', () => {
      const templates = [template({ name: '' }), template({ name: '  ', id: 't-2' })]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result[0].name).toBe('Unbenannt')
      expect(result[1].name).toBe('Unbenannt')
    })

    it('verwendet leeren prompt_template wenn leer', () => {
      const templates = [template({ prompt_template: '' })]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result[0].prompt_template).toBe('')
    })

    it('sortiert nach Phase (A vor B vor C) und dann nach created_at', () => {
      const templates = [
        template({ phase: 'C', created_at: '2024-02-01', id: 't-c2' }),
        template({ phase: 'A', created_at: '2024-01-01', id: 't-a' }),
        template({ phase: 'C', created_at: '2024-01-15', id: 't-c1' }),
      ]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result.map((r) => r.phase)).toEqual(['A', 'C', 'C'])
      expect(result[0].phase).toBe('A')
      expect(result[1].phase).toBe('C')
      expect(result[2].phase).toBe('C')
    })

    it('setzt display_order fortlaufend 0, 1, 2, …', () => {
      const templates = [
        template({ phase: 'A', id: 't-1' }),
        template({ phase: 'A', id: 't-2' }),
        template({ phase: 'B', id: 't-3' }),
      ]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result[0].display_order).toBe(0)
      expect(result[1].display_order).toBe(1)
      expect(result[2].display_order).toBe(2)
    })

    it('liefert keine id, created_at, updated_at (Insert-Format)', () => {
      const templates = [template()]
      const result = buildArtifactsFromTemplates(templates, categoryId)
      expect(result[0]).not.toHaveProperty('id')
      expect(result[0]).not.toHaveProperty('created_at')
      expect(result[0]).not.toHaveProperty('updated_at')
    })
  })

  describe('CATEGORY_DEFAULT_ARTIFACTS / BLOG_DEFAULT_ARTIFACTS', () => {
    it('Category hat 18 Standard-Artefakte', () => {
      expect(CATEGORY_DEFAULT_ARTIFACTS).toHaveLength(18)
    })

    it('Blog hat 12 Standard-Artefakte', () => {
      expect(BLOG_DEFAULT_ARTIFACTS).toHaveLength(12)
    })
  })

  describe('getDefaultArtifactsForCategory', () => {
    const categoryId = 'cat-123'

    it('gibt 18 Einträge für type category zurück', () => {
      const result = getDefaultArtifactsForCategory(categoryId, 'category')
      expect(result).toHaveLength(18)
    })

    it('gibt 12 Einträge für type blog zurück', () => {
      const result = getDefaultArtifactsForCategory(categoryId, 'blog')
      expect(result).toHaveLength(12)
    })

    it('setzt category_id auf übergebene ID', () => {
      const result = getDefaultArtifactsForCategory(categoryId, 'category')
      result.forEach((art) => {
        expect(art.category_id).toBe(categoryId)
      })
    })

    it('jeder Eintrag hat phase, artifact_code, name, prompt_template, display_order', () => {
      const result = getDefaultArtifactsForCategory(categoryId, 'category')
      result.forEach((art, i) => {
        expect(art).toHaveProperty('phase')
        expect(art).toHaveProperty('artifact_code')
        expect(art).toHaveProperty('name')
        expect(art).toHaveProperty('prompt_template')
        expect(art.display_order).toBe(i)
      })
    })

    it('kein Eintrag hat id, created_at, updated_at (Insert-Format)', () => {
      const result = getDefaultArtifactsForCategory(categoryId, 'category')
      result.forEach((art) => {
        expect(art).not.toHaveProperty('id')
        expect(art).not.toHaveProperty('created_at')
        expect(art).not.toHaveProperty('updated_at')
      })
    })

    it('category-Artefakte haben Phasen A bis F', () => {
      const result = getDefaultArtifactsForCategory(categoryId, 'category')
      const phases = [...new Set(result.map((a) => a.phase))]
      expect(phases.sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    })
  })
})
