import { describe, expect, it, vi } from 'vitest'
import { buildControlledTableTransaction } from '../controlledTableTransaction'

interface TestRow {
  id: number
  name: string
  count: number
}

const createRows = (): TestRow[] => [
  { id: 1, name: 'Alpha', count: 1 },
  { id: 2, name: 'Beta', count: 2 }
]

describe('buildControlledTableTransaction', () => {
  it('applies sequential patches to the latest version of the same row', () => {
    const rows = createRows()
    const result = buildControlledTableTransaction({
      sourceTableData: rows,
      updates: [
        { row: rows[0], patch: { name: 'Updated' } },
        { row: rows[0], patch: { count: 2 } }
      ],
      rowKey: 'id',
      resolveRowIndex: row => rows.indexOf(row)
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.nextTableData).toEqual([
      { id: 1, name: 'Updated', count: 2 },
      rows[1]
    ])
    expect(result.nextTableData[0]).not.toBe(rows[0])
    expect(result.nextTableData[1]).toBe(rows[1])
    expect(result.changes.map(change => change.fieldKey)).toEqual(['name', 'count'])
  })

  it('rejects the whole transaction when a row cannot be resolved', () => {
    const rows = createRows()
    const resolveRowIndex = vi.fn((row: TestRow) => rows.indexOf(row))
    const missingRow = { id: 3, name: 'Missing', count: 3 }
    const result = buildControlledTableTransaction({
      sourceTableData: rows,
      updates: [
        { row: rows[0], patch: { name: 'Updated' } },
        { row: missingRow, patch: { name: 'Rejected' } }
      ],
      rowKey: 'id',
      resolveRowIndex
    })

    expect(result).toEqual({ ok: false, reason: 'unresolved-row' })
    expect(rows[0].name).toBe('Alpha')
  })

  it('rejects patches that change the configured row identity', () => {
    const rows = createRows()
    const result = buildControlledTableTransaction({
      sourceTableData: rows,
      updates: [{ row: rows[0], patch: { id: 9 } }],
      rowKey: 'id',
      resolveRowIndex: () => 0
    })

    expect(result).toEqual({ ok: false, reason: 'row-identity-changed' })
  })

  it('returns a no-change result without copying the table', () => {
    const rows = createRows()
    const result = buildControlledTableTransaction({
      sourceTableData: rows,
      updates: [{ row: rows[0], patch: { name: 'Alpha' } }],
      rowKey: undefined,
      resolveRowIndex: () => 0
    })

    expect(result).toEqual({ ok: false, reason: 'no-change' })
  })
})
