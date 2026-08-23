import { computed } from 'vue'
import type { FormTableRowIndexResolver, TableRow } from '../types'

interface RowIndexLookup<TRow extends TableRow> {
  indexes: Map<TRow, number>
  duplicates: Set<TRow>
}

/**
 * 为当前受控 tableData 建立一次行引用索引，供全部单元格常数时间解析数据源下标。
 */
export function useRowIndex<TRow extends TableRow = TableRow>(
  getTableData: () => TRow[]
): FormTableRowIndexResolver<TRow> {
  const lookup = computed<RowIndexLookup<TRow>>(() => {
    const indexes = new Map<TRow, number>()
    const duplicates = new Set<TRow>()

    getTableData().forEach((row, index) => {
      if (indexes.has(row)) duplicates.add(row)
      else indexes.set(row, index)
    })

    return { indexes, duplicates }
  })

  /** 同一异常行在当前 FormTable 实例内只提示一次。 */
  const warnedRows = new WeakSet<object>()

  return (row, displayIndex) => {
    const tableData = getTableData()

    // 未经过内部排序/筛选时可用当前位置区分重复引用。
    if (tableData[displayIndex] === row) return displayIndex

    const currentLookup = lookup.value
    if (!currentLookup.duplicates.has(row)) {
      return currentLookup.indexes.get(row) ?? -1
    }

    if (import.meta.env.DEV && !warnedRows.has(row)) {
      warnedRows.add(row)
      console.warn(
        '[FormTable] The same row object appears more than once in tableData; '
        + 'its source index cannot be resolved safely after sorting or filtering, so field validation is disabled.'
      )
    }
    return -1
  }
}
