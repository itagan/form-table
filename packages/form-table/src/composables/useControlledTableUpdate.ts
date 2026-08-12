import type { FormTableValue, TableRow } from '../types/base'
import type { FormTableFieldChangePayload, FormTableRowKey } from '../types/config'
import type { FormTableUpdateApi } from '../types/context'
import { getValueByPath, setValueByPath } from '../utils/path'

type RowKey<TRow extends TableRow = TableRow> = FormTableRowKey<TRow> | undefined

interface ControlledTableUpdateOptions<TRow extends TableRow = TableRow> {
  getTableData: () => TRow[]
  getRowKey: () => RowKey<TRow>
  emitUpdate: (data: TRow[]) => void
  emitFieldChange: (payload: FormTableFieldChangePayload<TRow>) => void
}

interface IdentityIndex<TRow extends TableRow = TableRow> {
  source: TRow[]
  rowKey: Exclude<RowKey<TRow>, undefined>
  indexes: Map<unknown, number>
  duplicates: Set<unknown>
}

interface PendingFieldChange {
  fieldKey: string
  value: FormTableValue
  previousValue: FormTableValue
}

const NEGATIVE_ZERO_IDENTITY = Symbol('formTableNegativeZeroIdentity')

/** Map 使用 SameValueZero；单独编码 -0 以保持旧实现 Object.is 的身份语义。 */
const normalizeIdentity = (identity: FormTableValue) => (
  typeof identity === 'number' && Object.is(identity, -0)
    ? NEGATIVE_ZERO_IDENTITY
    : identity
)

/** 空字符串不是可用的字段路径，定位、校验和缓存都统一按未配置处理。 */
const isConfiguredRowKey = <TRow extends TableRow>(
  rowKey: RowKey<TRow>
): rowKey is Exclude<RowKey<TRow>, undefined> => (
  typeof rowKey === 'function' || (typeof rowKey === 'string' && rowKey.length > 0)
)

/**
 * 纯粹计算一行 patch 的结果和事件载荷，不触发 emit 或修改同步缓存。
 * patch 的 key 沿用公开 API 语义，可同时包含普通属性与嵌套字段路径。
 */
const applyRowPatch = <TRow extends TableRow>(
  currentRow: TRow,
  patch: Partial<TRow>
): { nextRow: TRow, changes: PendingFieldChange[] } => {
  let nextRow = currentRow
  const changes: PendingFieldChange[] = []

  Object.keys(patch).forEach((fieldKey) => {
    const value = patch[fieldKey]
    const previousValue = getValueByPath(nextRow, fieldKey)
    if (Object.is(previousValue, value)) return

    nextRow = setValueByPath(nextRow, fieldKey, value)
    changes.push({ fieldKey, value, previousValue })
  })

  return { nextRow, changes }
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
  let synchronousIdentityIndex: IdentityIndex<TRow> | null = null
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

  const getRowIdentity = (row: TRow, rowKey: Exclude<RowKey<TRow>, undefined>) => (
    typeof rowKey === 'function' ? rowKey(row) : getValueByPath(row, rowKey)
  )

  const getIdentityIndex = (
    sourceTableData: TRow[],
    rowKey: Exclude<RowKey<TRow>, undefined>
  ) => {
    if (
      synchronousIdentityIndex?.source === sourceTableData
      && synchronousIdentityIndex.rowKey === rowKey
    ) {
      return synchronousIdentityIndex
    }

    const indexes = new Map<unknown, number>()
    const duplicates = new Set<unknown>()
    sourceTableData.forEach((row, index) => {
      const identity = normalizeIdentity(getRowIdentity(row, rowKey))
      if (indexes.has(identity)) duplicates.add(identity)
      else indexes.set(identity, index)
    })

    synchronousIdentityIndex = { source: sourceTableData, rowKey, indexes, duplicates }
    return synchronousIdentityIndex
  }

  const resolveUpdateRowIndex = (
    sourceTableData: TRow[],
    targetRow: TRow,
    rowKey: RowKey<TRow>
  ) => {
    if (isConfiguredRowKey(rowKey)) {
      const identity = getRowIdentity(targetRow, rowKey)
      if (identity === undefined || identity === null) return -1

      const normalizedIdentity = normalizeIdentity(identity)
      const identityIndex = getIdentityIndex(sourceTableData, rowKey)
      if (identityIndex.duplicates.has(normalizedIdentity)) return -1
      return identityIndex.indexes.get(normalizedIdentity) ?? -1
    }

    const referenceIndex = sourceTableData.indexOf(targetRow)
    if (referenceIndex >= 0) return referenceIndex
    return synchronousRowIndexes.get(targetRow) ?? -1
  }

  const updateRow = (targetRow: TRow, patch: Partial<TRow>) => {
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

    const nextTableData = [...sourceTableData]
    nextTableData[rowIndex] = nextRow

    if (
      synchronousIdentityIndex?.source === sourceTableData
      && synchronousIdentityIndex.rowKey === rowKey
      && isConfiguredRowKey(rowKey)
    ) {
      synchronousIdentityIndex.source = nextTableData
    } else {
      synchronousIdentityIndex = null
    }

    synchronousUpdateBase = nextTableData
    synchronousRowIndexes.set(targetRow, rowIndex)
    synchronousRowIndexes.set(currentRow, rowIndex)
    synchronousRowIndexes.set(nextRow, rowIndex)
    scheduleUpdateBaseReset()
    options.emitUpdate(nextTableData)

    changes.forEach(change => {
      options.emitFieldChange({
        row: nextRow,
        index: rowIndex,
        ...change
      })
    })
  }

  return {
    setValue: (row, fieldKey, value) => updateRow(row, { [fieldKey]: value } as Partial<TRow>),
    updateRow
  }
}
