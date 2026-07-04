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

  it('clamps insert indexes before the first row and after the last row', () => {
    const tableData = [{ id: 1 }, { id: 2 }]

    expect(insertTableRow(tableData, -10, { id: 0 })).toEqual({
      insertIndex: 0,
      nextTableData: [{ id: 0 }, { id: 1 }, { id: 2 }]
    })
    expect(insertTableRow(tableData, 10, { id: 3 })).toEqual({
      insertIndex: 2,
      nextTableData: [{ id: 1 }, { id: 2 }, { id: 3 }]
    })
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
    expect(removeTableRow([], 0)).toBeNull()
    expect(removeTableRow([{ id: 1 }], -1)).toBeNull()
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

  it('clamps move targets and keeps the moved row reference', () => {
    const first = { id: 1 }
    const second = { id: 2 }
    const third = { id: 3 }

    expect(moveTableRow([first, second, third], 2, -10)).toEqual({
      movedRow: third,
      normalizedToIndex: 0,
      nextTableData: [third, first, second]
    })
    expect(moveTableRow([first, second, third], 0, 10)).toEqual({
      movedRow: first,
      normalizedToIndex: 2,
      nextTableData: [second, third, first]
    })
  })

  it('returns null for no-op moves', () => {
    expect(moveTableRow([{ id: 1 }], 0, 0)).toBeNull()
    expect(moveTableRow([{ id: 1 }], 0, -10)).toBeNull()
    expect(moveTableRow([{ id: 1 }], 2, 0)).toBeNull()
    expect(moveTableRow([], 0, 0)).toBeNull()
  })
})
