import type { FormTableRowPatch, TableRow } from '../types/base'
import type { FormTableFieldChangePayload } from '../types/config/events'
import type { FormTableUpdateApi } from '../types/context'
import { applyRowPatch } from '../utils/rowPatch'
import {
  createRowIdentityIndex,
  getRowIdentity,
  isConfiguredRowKey,
  resolveRowIdentityIndex
} from '../utils/rowIdentity'
import type { RowIdentityIndex, RowKey } from '../utils/rowIdentity'

interface ControlledTableUpdateOptions<TRow extends TableRow = TableRow> {
  getTableData: () => TRow[]
  getRowKey: () => RowKey<TRow>
  emitUpdate: (data: TRow[]) => void
  emitFieldChange: (payload: FormTableFieldChangePayload<TRow>) => void
}

/** 集中管理受控表格的不可变更新、同步组合以及稳定行定位。 */
export function useControlledTableUpdate<TRow extends TableRow = TableRow>(
  options: ControlledTableUpdateOptions<TRow>
): FormTableUpdateApi<TRow> {
  /**
   * 父组件通常要到下一轮 Vue 更新才会把新 props 传回。这里暂存本轮 emit 的结果，
   * 让同一调用栈或同一微任务内的多次 setValue/updateRow 能基于最新结果继续组合。
   */
  let synchronousUpdateBase: TRow[] | null = null
  /** 无 rowKey 时，旧上下文仍可通过本轮出现过的行引用定位到最新行。 */
  const synchronousRowIndexes = new Map<TRow, number>()
  /** rowKey 索引只绑定到特定数组引用和 rowKey，避免每次同步更新都扫描整表。 */
  let synchronousIdentityIndex: RowIdentityIndex<TRow> | null = null
  let updateBaseResetPending = false

  /** 微任务结束后必须重新信任受控 props，不能让内部快照成为第二份长期状态。 */
  const scheduleUpdateBaseReset = () => {
    if (updateBaseResetPending) return
    updateBaseResetPending = true
    Promise.resolve().then(() => {
      synchronousUpdateBase = null
      synchronousRowIndexes.clear()
      synchronousIdentityIndex = null
      updateBaseResetPending = false
    })
  }

  const getIdentityIndex = (
    sourceTableData: TRow[],
    rowKey: Exclude<RowKey<TRow>, undefined>
  ) => {
    // 索引与数组引用、rowKey 配置共同绑定；任一变化都必须重新扫描。
    if (
      synchronousIdentityIndex?.source === sourceTableData
      && synchronousIdentityIndex.rowKey === rowKey
    ) {
      return synchronousIdentityIndex
    }

    synchronousIdentityIndex = createRowIdentityIndex(sourceTableData, rowKey)
    return synchronousIdentityIndex
  }

  const resolveUpdateRowIndex = (
    sourceTableData: TRow[],
    targetRow: TRow,
    rowKey: RowKey<TRow>
  ) => {
    if (isConfiguredRowKey(rowKey)) {
      const identityIndex = getIdentityIndex(sourceTableData, rowKey)
      return resolveRowIdentityIndex(identityIndex, targetRow, rowKey)
    }

    // 优先相信当前数组中的直接引用；同步映射只为上一轮写回前的旧引用兜底。
    const referenceIndex = sourceTableData.indexOf(targetRow)
    if (referenceIndex >= 0) return referenceIndex
    return synchronousRowIndexes.get(targetRow) ?? -1
  }

  const updateRow = (targetRow: TRow, patch: FormTableRowPatch<TRow>) => {
    // 一次更新事务严格按：定位 -> 计算 -> 身份校验 -> 提交 -> 发事件执行。
    const sourceTableData = synchronousUpdateBase || options.getTableData()
    const rowKey = options.getRowKey()
    const rowIndex = resolveUpdateRowIndex(sourceTableData, targetRow, rowKey)
    if (rowIndex < 0) return
    const currentRow = sourceTableData[rowIndex]
    if (!currentRow) return

    const { nextRow, changes } = applyRowPatch(currentRow, patch)
    if (changes.length === 0) return

    if (
      isConfiguredRowKey(rowKey)
      && !Object.is(getRowIdentity(currentRow, rowKey), getRowIdentity(nextRow, rowKey))
    ) {
      if (import.meta.env.DEV) {
        console.warn('[FormTable] rowKey is an immutable row identity; updateRow rejected a patch that changes it.')
      }
      return
    }

    // 到这里事务已通过全部拒绝条件，后续提交必须保持 update 先于字段事件。
    const nextTableData = [...sourceTableData]
    nextTableData[rowIndex] = nextRow

    if (
      synchronousIdentityIndex?.source === sourceTableData
      && synchronousIdentityIndex.rowKey === rowKey
      && isConfiguredRowKey(rowKey)
    ) {
      // rowKey 不可变，因此行内容替换后原索引仍有效，只需推进其数组快照引用。
      synchronousIdentityIndex.source = nextTableData
    } else {
      synchronousIdentityIndex = null
    }

    synchronousUpdateBase = nextTableData
    // 同步调用方可能持有任意阶段的行引用，三者都映射到同一最新位置。
    synchronousRowIndexes.set(targetRow, rowIndex)
    synchronousRowIndexes.set(currentRow, rowIndex)
    synchronousRowIndexes.set(nextRow, rowIndex)
    scheduleUpdateBaseReset()
    options.emitUpdate(nextTableData)

    // applyRowPatch 保留 patch 的字段顺序，field-change 按相同顺序逐项派发。
    changes.forEach(change => {
      options.emitFieldChange({
        row: nextRow,
        index: rowIndex,
        ...change
      })
    })
  }

  return {
    setValue: (row, fieldKey, value) => updateRow(
      row,
      { [fieldKey]: value } as FormTableRowPatch<TRow>
    ),
    updateRow
  }
}
