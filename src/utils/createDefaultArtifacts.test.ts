import { describe, it, expect } from 'vitest'
import {
  getDefaultArtifactsForCategory,
  CATEGORY_DEFAULT_ARTIFACTS,
  BLOG_DEFAULT_ARTIFACTS,
} from './createDefaultArtifacts'

describe('createDefaultArtifacts', () => {
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
