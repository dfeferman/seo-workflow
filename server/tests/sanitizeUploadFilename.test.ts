import { describe, expect, it } from 'vitest'
import { sanitizeUploadFilename } from '../lib/sanitizeUploadFilename.js'

describe('sanitizeUploadFilename', () => {
  it('accepts valid .md basename', () => {
    const r = sanitizeUploadFilename('Mein-Artikel.md')
    expect(r).toEqual({ ok: true, filename: 'Mein-Artikel.md' })
  })

  it('strips directory segments', () => {
    const r = sanitizeUploadFilename('..\\evil\\..\\x.md')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.filename).toBe('x.md')
  })

  it('rejects non-md', () => {
    const r = sanitizeUploadFilename('x.txt')
    expect(r.ok).toBe(false)
  })

  it('replaces unsafe characters in stem', () => {
    const r = sanitizeUploadFilename('a b$c.md')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.filename).toBe('a_b_c.md')
  })
})
