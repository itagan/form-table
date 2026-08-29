import { describe, expect, it, vi } from 'vitest'
import type { FormTableFieldChangePayload, TableRow } from '../../types'
import { useControlledTableUpdate } from '../useControlledTableUpdate'

describe('useControlledTableUpdate row identity', () => {
  it.each([
    ['string rowKey', 'id', { id: 2 }],
    ['nested rowKey', 'meta.identity', { 'meta.identity': 'b' }],
    ['function rowKey', (row: TableRow) => row.id, { id: 2 }]
  ])('rejects a patch that changes a %s', (_label, rowKey, patch) => {
    const original = rowKey === 'meta.identity'
      ? { meta: { identity: 'a' }, name: 'Alice' }
      : { id: 1, name: 'Alice' }
    let tableData: TableRow[] = [original]
    const emitUpdate = vi.fn((nextTableData: TableRow[]) => {
      tableData = nextTableData
    })
    const emitFieldChange = vi.fn((_payload: FormTableFieldChangePayload) => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const updateApi = useControlledTableUpdate({
      getTableData: () => tableData,
      getRowKey: () => rowKey,
      emitUpdate,
      emitFieldChange
    })

    try {
      updateApi.updateRow(original, { ...patch, name: 'Wrong update' })

      expect(tableData).toEqual([original])
      expect(emitUpdate).not.toHaveBeenCalled()
      expect(emitFieldChange).not.toHaveBeenCalled()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('immutable row identity'))
    } finally {
      warn.mockRestore()
    }
  })

  it('keeps ordinary patches working when rowKey remains unchanged', () => {
    const original = { id: 1, name: 'Alice' }
    let tableData: TableRow[] = [original]
    const emitFieldChange = vi.fn()
    const updateApi = useControlledTableUpdate({
      getTableData: () => tableData,
      getRowKey: () => 'id',
      emitUpdate: nextTableData => { tableData = nextTableData },
      emitFieldChange
    })

    updateApi.updateRow(original, { name: 'Alicia' })

    expect(tableData).toEqual([{ id: 1, name: 'Alicia' }])
    expect(emitFieldChange).toHaveBeenCalledWith(expect.objectContaining({
      fieldKey: 'name',
      value: 'Alicia',
      previousValue: 'Alice'
    }))
  })

  it('treats an empty rowKey as unconfigured', () => {
    const original = { name: 'Alice' }
    let tableData: TableRow[] = [original]
    const emitFieldChange = vi.fn()
    const updateApi = useControlledTableUpdate({
      getTableData: () => tableData,
      getRowKey: () => '',
      emitUpdate: nextTableData => { tableData = nextTableData },
      emitFieldChange
    })

    updateApi.updateRow(original, { name: 'Alicia' })

    expect(tableData).toEqual([{ name: 'Alicia' }])
    expect(emitFieldChange).toHaveBeenCalledOnce()
  })

  it('atomically composes multi-row updates and emits final rows in field order', () => {
    const first = { id: 1, name: 'Alice', profile: { city: '杭州' } }
    const second = { id: 2, name: 'Bob', profile: { city: '上海' } }
    let tableData: TableRow[] = [first, second]
    const emitUpdate = vi.fn((nextTableData: TableRow[]) => { tableData = nextTableData })
    const emitFieldChange = vi.fn()
    const updateApi = useControlledTableUpdate({
      getTableData: () => tableData,
      getRowKey: () => 'id',
      emitUpdate,
      emitFieldChange
    })

    expect(updateApi.updateRows([
      { row: first, patch: { name: 'Alicia', 'profile.city': '宁波' } },
      { row: second, patch: { name: 'Robert' } },
      { row: first, patch: { name: 'Ada' } }
    ])).toBe(true)

    expect(emitUpdate).toHaveBeenCalledOnce()
    expect(tableData).toEqual([
      { id: 1, name: 'Ada', profile: { city: '宁波' } },
      { id: 2, name: 'Robert', profile: { city: '上海' } }
    ])
    expect(emitFieldChange.mock.calls.map(([payload]) => payload)).toEqual([
      expect.objectContaining({ row: tableData[0], index: 0, fieldKey: 'name', previousValue: 'Alice', value: 'Alicia' }),
      expect.objectContaining({ row: tableData[0], index: 0, fieldKey: 'profile.city', previousValue: '杭州', value: '宁波' }),
      expect.objectContaining({ row: tableData[1], index: 1, fieldKey: 'name', previousValue: 'Bob', value: 'Robert' }),
      expect.objectContaining({ row: tableData[0], index: 0, fieldKey: 'name', previousValue: 'Alicia', value: 'Ada' })
    ])
  })

  it('rejects an entire batch when any target or row identity mutation is invalid', () => {
    const first = { id: 1, name: 'Alice' }
    const second = { id: 2, name: 'Bob' }
    let tableData: TableRow[] = [first, second]
    const emitUpdate = vi.fn((nextTableData: TableRow[]) => { tableData = nextTableData })
    const emitFieldChange = vi.fn()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const updateApi = useControlledTableUpdate({
      getTableData: () => tableData,
      getRowKey: () => 'id',
      emitUpdate,
      emitFieldChange
    })

    expect(updateApi.updateRows([
      { row: first, patch: { name: 'Alicia' } },
      { row: { id: 3, name: 'Missing' }, patch: { name: 'Rejected' } }
    ])).toBe(false)
    expect(updateApi.updateRows([
      { row: first, patch: { name: 'Alicia' } },
      { row: second, patch: { id: 3 } }
    ])).toBe(false)
    expect(tableData).toEqual([first, second])
    expect(emitUpdate).not.toHaveBeenCalled()
    expect(emitFieldChange).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('returns false for empty or unchanged batches', () => {
    const row = { id: 1, name: 'Alice' }
    const emitUpdate = vi.fn()
    const updateApi = useControlledTableUpdate({
      getTableData: () => [row],
      getRowKey: () => 'id',
      emitUpdate,
      emitFieldChange: vi.fn()
    })

    expect(updateApi.updateRows([])).toBe(false)
    expect(updateApi.updateRows([{ row, patch: { name: 'Alice' } }])).toBe(false)
    expect(emitUpdate).not.toHaveBeenCalled()
  })

  it('updates a large batch with one array emission while preserving untouched references', () => {
    const tableData = Array.from({ length: 1000 }, (_, index) => ({ id: index, value: index }))
    let currentRows: TableRow[] = tableData
    const emitUpdate = vi.fn((nextTableData: TableRow[]) => { currentRows = nextTableData })
    const updateApi = useControlledTableUpdate({
      getTableData: () => currentRows,
      getRowKey: () => 'id',
      emitUpdate,
      emitFieldChange: vi.fn()
    })

    const updates = tableData.filter(row => row.id % 100 === 0).map(row => ({
      row,
      patch: { value: row.value + 1 }
    }))
    expect(updateApi.updateRows(updates)).toBe(true)
    expect(emitUpdate).toHaveBeenCalledOnce()
    expect(currentRows[1]).toBe(tableData[1])
    expect(currentRows[100]).not.toBe(tableData[100])
  })
})
