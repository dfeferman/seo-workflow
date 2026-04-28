import { describe, expect, it } from 'vitest'
import { dedupeOutgoingLinks } from '../lib/dedupeOutgoingLinks.js'

describe('dedupeOutgoingLinks', () => {
  it('bumps lineEnd for duplicate to+anchor+lineStart', () => {
    const a = dedupeOutgoingLinks([
      { toPageId: '1', anchorText: 'x', lineStart: 3 },
      { toPageId: '1', anchorText: 'x', lineStart: 3 },
    ])
    expect(a[0].lineEnd).toBe(3)
    expect(a[1].lineEnd).toBe(4)
  })
})
