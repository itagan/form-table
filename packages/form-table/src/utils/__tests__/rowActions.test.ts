import { describe, expect, it } from 'vitest'
import {
  insertTableRow,
  moveTableRow,
  normalizeInsertIndex,
  normalizeMoveIndex,
  removeTableRow
} from '../rowActions'

describe('row action utils', () => {
  it('normalizes insert and move indexes', () => {
    expect(normalizeInsertIndex(-1, 2)).toBe(0)
    expect(normalizeInsertIndex(3, 2)).toBe(2)
    expect(normalizeMoveIndex(-1, 2)).toBe(0)
    expect(normalizeMoveIndex(3, 2)).toBe(1)
    expect(normalizeMoveIndex(3, 0)).toBe(0)
  })

  it('inserts rows immutably', () => {
    const tableData = [{ id: 1 }, { id: 3 }]
    const result = insertTableRow(tableData, 1, { id: 2 })

    expect(result.insertIndex).toBe(1)
    expect(result.nextTableData).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(result.nextTableData).not.toBe(tableData)
    expect(tableData).toEqual([{ id: 1 }, { id: 3 }])
  })

  it('removes rows immutably and returns removed row', () => {
    const tableData = [{ id: 1 }, { id: 2 }]
    const result = removeTableRow(tableData, 0)

    expect(result).toEqual({
      removedRow: { id: 1 },
      nextTableData: [{ id: 2 }]
    })
    expect(tableData).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('returns null when removing an invalid row', () => {
    expect(removeTableRow([{ id: 1 }], 3)).toBeNull()
  })

  it('moves rows immutably', () => {
    const tableData = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const result = moveTableRow(tableData, 0, 2)

    expect(result).toEqual({
      movedRow: { id: 1 },
      normalizedToIndex: 2,
      nextTableData: [{ id: 2 }, { id: 3 }, { id: 1 }]
    })
    expect(tableData).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
  })

  it('returns null for no-op moves', () => {
    expect(moveTableRow([{ id: 1 }], 0, 0)).toBeNull()
    expect(moveTableRow([{ id: 1 }], 2, 0)).toBeNull()
  })
})
