import { describe, expect, it, vi } from 'vitest'
import { getValueByPath, setValueByPath } from '../path'

describe('path utils', () => {
  it('reads dot paths and array index paths', () => {
    const row = {
      profile: {
        city: 'Shanghai'
      },
      contacts: [
        {
          phone: '13800000000'
        }
      ]
    }

    expect(getValueByPath(row, 'profile.city')).toBe('Shanghai')
    expect(getValueByPath(row, 'contacts[0].phone')).toBe('13800000000')
    expect(getValueByPath(row, 'contacts.1.phone')).toBeUndefined()
  })

  it('writes nested values without mutating the original row', () => {
    const row = {
      profile: {
        city: 'Shanghai',
        district: 'Pudong'
      },
      contacts: [
        {
          phone: '13800000000'
        }
      ]
    }

    const nextRow = setValueByPath(row, 'contacts[0].phone', '13900000000')

    expect(nextRow).not.toBe(row)
    expect(nextRow.contacts).not.toBe(row.contacts)
    expect(nextRow.contacts[0]).not.toBe(row.contacts[0])
    expect(nextRow.contacts[0].phone).toBe('13900000000')
    expect(row.contacts[0].phone).toBe('13800000000')
  })

  it('creates missing nested objects while writing', () => {
    const nextRow = setValueByPath({}, 'profile.address.city', 'Hangzhou')

    expect(nextRow).toEqual({
      profile: {
        address: {
          city: 'Hangzhou'
        }
      }
    })
  })

  it('creates missing arrays for canonical numeric path segments', () => {
    const row: {
      untouched: { value: boolean }
      items?: Array<{ name: string }>
    } = { untouched: { value: true } }

    const nextRow = setValueByPath(row, 'items[0].name', 'Alice')

    expect(nextRow).toEqual({
      untouched: { value: true },
      items: [{ name: 'Alice' }]
    })
    expect(Array.isArray(nextRow.items)).toBe(true)
    expect(nextRow.untouched).toBe(row.untouched)
    expect(row).toEqual({ untouched: { value: true } })
  })

  it('does not read inherited properties', () => {
    const row = Object.create({ inherited: 'hidden' })
    row.own = 'visible'

    expect(getValueByPath(row, 'own')).toBe('visible')
    expect(getValueByPath(row, 'inherited')).toBeUndefined()
  })

  it.each(['__proto__', 'prototype', 'constructor'])(
    'rejects unsafe %s path segments for reads and writes',
    (segment) => {
      const path = `profile.${segment}.polluted`

      expect(() => getValueByPath({}, path)).toThrowError(TypeError)
      expect(() => getValueByPath({}, path)).toThrowError(path)
      expect(() => setValueByPath({}, path, true)).toThrowError(TypeError)
      expect(() => setValueByPath({}, path, true)).toThrowError(path)
    }
  )

  it('reuses normalized paths and evicts the oldest entry after the cache limit', () => {
    const replaceSpy = vi.spyOn(String.prototype, 'replace')
    const source = { cacheBoundary: {} }
    const paths = Array.from({ length: 520 }, (_, index) => `cacheBoundary.${index}`)

    try {
      paths.forEach(path => getValueByPath(source, path))
      const initialNormalizationCount = replaceSpy.mock.calls.length
      expect(initialNormalizationCount).toBe(520)

      getValueByPath(source, paths[0])
      expect(replaceSpy).toHaveBeenCalledTimes(initialNormalizationCount + 1)

      getValueByPath(source, paths[paths.length - 1])
      expect(replaceSpy).toHaveBeenCalledTimes(initialNormalizationCount + 1)
    } finally {
      replaceSpy.mockRestore()
    }
  })
})
