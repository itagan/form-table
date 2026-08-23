import { describe, expect, it } from 'vitest'
import { applyRowPatch } from '../rowPatch'

describe('row patch utils', () => {
  it('applies ordinary and nested fields immutably in patch order', () => {
    const profile = { city: '杭州', zip: '310000' }
    const metadata = { source: 'import' }
    const original = { name: 'Alice', profile, metadata }

    const result = applyRowPatch(original, {
      name: 'Alicia',
      'profile.city': '宁波'
    })

    expect(result.nextRow).toEqual({
      name: 'Alicia',
      profile: { city: '宁波', zip: '310000' },
      metadata
    })
    expect(result.nextRow).not.toBe(original)
    expect(result.nextRow.profile).not.toBe(profile)
    expect(result.nextRow.metadata).toBe(metadata)
    expect(original).toEqual({ name: 'Alice', profile, metadata })
    expect(result.changes).toEqual([
      { fieldKey: 'name', value: 'Alicia', previousValue: 'Alice' },
      { fieldKey: 'profile.city', value: '宁波', previousValue: '杭州' }
    ])
  })

  it('returns the original row and no changes when every value is unchanged', () => {
    const original = { name: 'Alice', score: Number.NaN }

    const result = applyRowPatch(original, { name: 'Alice', score: Number.NaN })

    expect(result.nextRow).toBe(original)
    expect(result.changes).toEqual([])
  })
})
