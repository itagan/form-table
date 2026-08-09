import type {
  FormTableFieldChangePayload,
  FormTableUpdateApi,
  FormTableValue,
  TableRow
} from '../types'
import { getValueByPath, setValueByPath } from '../utils/path'

type RowKey<TRow extends TableRow = TableRow> = string | ((row: TRow) => FormTableValue) | undefined

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

const NEGATIVE_ZERO_IDENTITY = Symbol('formTableNegativeZeroIdentity')

/** Map 使用 SameValueZero；单独编码 -0 以保持旧实现 Object.is 的身份语义。 */
const normalizeIdentity = (identity: FormTableValue) => (
  typeof identity === 'number' && Object.is(identity, -0)
    ? NEGATIVE_ZERO_IDENTITY
    : identity
)

/** 集中管理受控表格的不可变更新、同步组合以及稳定行定位。 */
export function useControlledTableUpdate<TRow extends TableRow = TableRow>(
  options: ControlledTableUpdateOptions<TRow>
): FormTableUpdateApi<TRow> {
  let synchronousUpdateBase: TRow[] | null = null
  const synchronousRowIndexes = new Map<TRow, number>()
  let synchronousIdentityIndex: IdentityIndex<TRow> | null = null
  let updateBaseResetPending = false

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
    targetRow: TRow
  ) => {
    const rowKey = options.getRowKey()
    if (typeof rowKey === 'function' || (typeof rowKey === 'string' && rowKey)) {
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
    const sourceTableData = synchronousUpdateBase || options.getTableData()
    const rowIndex = resolveUpdateRowIndex(sourceTableData, targetRow)
    if (rowIndex < 0) return
    const currentRow = sourceTableData[rowIndex]
    if (!currentRow) return

    let nextRow = currentRow
    const changes: Array<{
      fieldKey: string
      value: FormTableValue
      previousValue: FormTableValue
    }> = []

    Object.keys(patch).forEach((fieldKey) => {
      const value = patch[fieldKey]
      const previousValue = getValueByPath(nextRow, fieldKey)
      if (Object.is(previousValue, value)) return

      nextRow = setValueByPath(nextRow, fieldKey, value)
      changes.push({ fieldKey, value, previousValue })
    })

    if (changes.length === 0) return

    const rowKey = options.getRowKey()
    if (
      rowKey !== undefined
      && !Object.is(getRowIdentity(currentRow, rowKey), getRowIdentity(nextRow, rowKey))
    ) {
      if (import.meta.env.DEV) {
        console.warn('[FormTable] tableProps.rowKey is an immutable row identity; updateRow rejected a patch that changes it.')
      }
      return
    }

    const nextTableData = [...sourceTableData]
    nextTableData[rowIndex] = nextRow

    if (
      synchronousIdentityIndex?.source === sourceTableData
      && synchronousIdentityIndex.rowKey === rowKey
      && rowKey !== undefined
      && Object.is(getRowIdentity(currentRow, rowKey), getRowIdentity(nextRow, rowKey))
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
