import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ColumnConfig, TableRow } from '../../types'
import { useFormTableDiagnostics } from '../useFormTableDiagnostics'

describe('useFormTableDiagnostics dependency isolation', () => {
  it('does not rescan column structure when only table data changes', async () => {
    const tableData = ref<TableRow[]>([{ id: 1 }])
    const columns = ref<ColumnConfig[]>([{
      key: 'name',
      label: '姓名',
      children: [{ children: [{ fieldKey: 'name', type: 'input' }] }]
    }])
    const getTableData = vi.fn(() => tableData.value)
    const getColumns = vi.fn(() => columns.value)
    const getRowKey = vi.fn(() => 'id')
    const getLegacyRowKey = vi.fn(() => undefined)
    const scope = effectScope()
    scope.run(() => {
      useFormTableDiagnostics({
        getTableData,
        getColumns,
        getRowKey,
        getLegacyRowKey
      } as any)
    })
    await nextTick()

    const initialColumnReads = getColumns.mock.calls.length
    const initialLegacyReads = getLegacyRowKey.mock.calls.length
    tableData.value = [{ id: 1 }, { id: 2 }]
    await nextTick()

    expect(getTableData.mock.calls.length).toBeGreaterThan(1)
    expect(getColumns).toHaveBeenCalledTimes(initialColumnReads)
    expect(getLegacyRowKey).toHaveBeenCalledTimes(initialLegacyReads)
    scope.stop()
  })

  it('does not rescan row identities when only column structure changes', async () => {
    const tableData = ref<TableRow[]>([{ id: 1 }])
    const columns = ref<ColumnConfig[]>([])
    const getTableData = vi.fn(() => tableData.value)
    const getColumns = vi.fn(() => columns.value)
    const scope = effectScope()
    scope.run(() => {
      useFormTableDiagnostics({
        getTableData,
        getColumns,
        getRowKey: () => 'id',
        getLegacyRowKey: () => undefined
      } as any)
    })
    await nextTick()

    const initialTableReads = getTableData.mock.calls.length
    columns.value = [{ props: { type: 'index' } }]
    await nextTick()

    expect(getColumns.mock.calls.length).toBeGreaterThan(1)
    expect(getTableData).toHaveBeenCalledTimes(initialTableReads)
    scope.stop()
  })
})
