import { describe, expect, it } from 'vitest'
import type { TableRow } from '../../types/base'
import {
  createRowIdentityIndex,
  getRowIdentity,
  isConfiguredRowKey,
  normalizeRowIdentity,
  resolveRowIdentityIndex
} from '../rowIdentity'

describe('row identity utils', () => {
  it('recognizes configured string and function keys but rejects empty keys', () => {
    expect(isConfiguredRowKey(undefined)).toBe(false)
    expect(isConfiguredRowKey('')).toBe(false)
    expect(isConfiguredRowKey('id')).toBe(true)
    expect(isConfiguredRowKey(row => row.id)).toBe(true)
  })

  it('reads nested string and function identities', () => {
    const row = { meta: { identity: 'nested-id' }, id: 'function-id' }

    expect(getRowIdentity(row, 'meta.identity')).toBe('nested-id')
    expect(getRowIdentity(row, current => current.id)).toBe('function-id')
  })

  it('resolves unique identities and rejects missing identities', () => {
    const rows: TableRow[] = [{ id: 1 }, { id: 2 }]
    const index = createRowIdentityIndex(rows, 'id')

    expect(resolveRowIdentityIndex(index, { id: 2 }, 'id')).toBe(1)
    expect(resolveRowIdentityIndex(index, { id: 3 }, 'id')).toBe(-1)
    expect(resolveRowIdentityIndex(index, {}, 'id')).toBe(-1)
    expect(resolveRowIdentityIndex(index, { id: null }, 'id')).toBe(-1)
  })

  it('rejects duplicated identities', () => {
    const rows = [{ id: 'duplicate' }, { id: 'duplicate' }]
    const index = createRowIdentityIndex(rows, 'id')

    expect(resolveRowIdentityIndex(index, { id: 'duplicate' }, 'id')).toBe(-1)
  })

  it('keeps positive and negative zero as distinct identities', () => {
    const rows = [{ id: 0 }, { id: -0 }]
    const index = createRowIdentityIndex(rows, 'id')

    expect(normalizeRowIdentity(0)).not.toBe(normalizeRowIdentity(-0))
    expect(resolveRowIdentityIndex(index, { id: 0 }, 'id')).toBe(0)
    expect(resolveRowIdentityIndex(index, { id: -0 }, 'id')).toBe(1)
  })
})
