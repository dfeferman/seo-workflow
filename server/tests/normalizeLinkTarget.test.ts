import { describe, expect, it } from 'vitest'
import { normalizeLinkTarget } from '../lib/normalizeLinkTarget.js'

describe('normalizeLinkTarget', () => {
  it('returns path from https URL', () => {
    expect(normalizeLinkTarget('https://example.com/pfad/x')).toBe('pfad/x')
  })

  it('returns null for domain-only https', () => {
    expect(normalizeLinkTarget('https://example.com/')).toBeNull()
    expect(normalizeLinkTarget('https://example.com')).toBeNull()
  })

  it('returns null for mailto and hash-only', () => {
    expect(normalizeLinkTarget('mailto:a@b.de')).toBeNull()
    expect(normalizeLinkTarget('#anchor')).toBeNull()
  })

  it('normalizes root-relative path', () => {
    expect(normalizeLinkTarget('/a//b/')).toBe('a/b/')
  })
})
