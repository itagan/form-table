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
})
