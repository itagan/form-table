import type { FormTableRowUpdate, TableRow } from '../types/base'
import { applyRowPatch } from './rowPatch'
import { getRowIdentity, isConfiguredRowKey } from './rowIdentity'
import type { RowKey } from './rowIdentity'

interface TableTransactionOptions<TRow extends TableRow> {
  sourceTableData: TRow[]
  updates: FormTableRowUpdate<TRow>[]
  rowKey: RowKey<TRow>
  resolveRowIndex: (row: TRow) => number
}

export interface TableTransactionChange {
  index: number
  fieldKey: string
  value: unknown
  previousValue: unknown
}

export type TableTransactionFailureReason =
  | 'no-change'
  | 'row-identity-changed'
  | 'unresolved-row'

export type TableTransactionResult<TRow extends TableRow> = {
  ok: false
  reason: TableTransactionFailureReason
} | {
  ok: true
  nextTableData: TRow[]
  referencedRows: Map<TRow, number>
  changes: TableTransactionChange[]
}

/**
 * 按配置顺序计算一次原子行更新。该函数不保存状态也不派发事件，
 * 任一行无法定位或试图修改 rowKey 时拒绝整个事务。
 */
export function buildControlledTableTransaction<TRow extends TableRow>(
  options: TableTransactionOptions<TRow>
): TableTransactionResult<TRow> {
  const { sourceTableData, updates, rowKey, resolveRowIndex } = options
  const workingRows = new Map<number, TRow>()
  const referencedRows = new Map<TRow, number>()
  const changes: TableTransactionChange[] = []

  for (const update of updates) {
    const rowIndex = resolveRowIndex(update.row)
    const currentRow = rowIndex >= 0
      ? workingRows.get(rowIndex) || sourceTableData[rowIndex]
      : undefined
    if (!currentRow) return { ok: false, reason: 'unresolved-row' }

    const patchResult = applyRowPatch(currentRow, update.patch)
    if (
      isConfiguredRowKey(rowKey)
      && !Object.is(
        getRowIdentity(currentRow, rowKey),
        getRowIdentity(patchResult.nextRow, rowKey)
      )
    ) {
      return { ok: false, reason: 'row-identity-changed' }
    }

    referencedRows.set(update.row, rowIndex)
    referencedRows.set(currentRow, rowIndex)
    if (patchResult.changes.length === 0) continue

    workingRows.set(rowIndex, patchResult.nextRow)
    referencedRows.set(patchResult.nextRow, rowIndex)
    patchResult.changes.forEach(change => changes.push({ index: rowIndex, ...change }))
  }

  if (changes.length === 0) return { ok: false, reason: 'no-change' }

  const nextTableData = [...sourceTableData]
  workingRows.forEach((row, index) => {
    nextTableData[index] = row
  })

  return { ok: true, nextTableData, referencedRows, changes }
}
