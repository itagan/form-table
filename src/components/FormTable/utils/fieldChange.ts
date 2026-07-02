import type {
  FormItemConfig,
  FormTableFieldChangeContext,
  FormTableFieldChangePayload,
  TableRow
} from '../types'
import { getFormItemOnValueChange } from './fieldConfig'
import { getValueByPath, setValueByPath } from './path'

/**
 * 初始化行数据时需要模拟的字段变更。
 *
 * 新增、插入、复制行都会先构造一条草稿行，再用这些变更触发
 * `behavior.onValueChange`，从而让默认值和传入种子值也能走同一套联动链路。
 */
export interface InitialFieldChange {
  fieldKey: string
  value: any
  previousValue: any
}

/**
 * 单次行变更解析结果。
 *
 * `nextRow` 是应用初始 patch 和所有联动 patch 后的最终行；
 * `fieldChanges` 会按字段去重，只保留从最初值到最终值的有效变化。
 */
export interface ResolvedRowChange {
  nextRow: TableRow
  fieldChanges: FormTableFieldChangePayload[]
}

interface ResolveRowChangeContext {
  rowIndex: number
  currentRow: TableRow
  tableData: TableRow[]
  formData: Record<string, any>
  getFieldConfig: (fieldKey: string) => FormItemConfig | undefined
}

interface ResolveRowChangeOptions {
  tableData?: TableRow[]
  initialPatch?: Partial<TableRow>
  initialChanges?: InitialFieldChange[]
}

/**
 * 创建传给字段联动函数的运行上下文。
 *
 * 这里的 `formData.tableData` 始终使用本轮解析中的临时 tableData，
 * 确保联动函数读取到的是已经应用前序 patch 的最新快照。
 */
function createFieldChangeContext(
  rowIndex: number,
  row: TableRow,
  fieldKey: string,
  value: any,
  previousValue: any,
  tableData: TableRow[],
  formData: Record<string, any>
): FormTableFieldChangeContext {
  return {
    row,
    index: rowIndex,
    fieldKey,
    value,
    previousValue,
    tableData,
    formData: {
      ...formData,
      tableData
    },
    getValue: (path: string) => getValueByPath(row, path)
  }
}

/**
 * 从一条已构造好的行中生成初始化变更列表。
 *
 * 只为实际有值的字段生成变更，避免未设置的字段触发无意义的联动。
 */
export function createInitialFieldChanges(
  row: TableRow,
  fieldKeys: string[]
): InitialFieldChange[] {
  return fieldKeys.reduce<InitialFieldChange[]>((changes, fieldKey) => {
    const value = getValueByPath(row, fieldKey)
    if (value === undefined) {
      return changes
    }

    changes.push({
      fieldKey,
      value,
      previousValue: undefined
    })
    return changes
  }, [])
}

/**
 * 解析一次行变更，并递归处理字段联动。
 *
 * 处理流程：
 * 1. 应用外部传入的初始 patch 或初始化变更。
 * 2. 对每个真实变化字段执行对应的 `behavior.onValueChange`。
 * 3. 如果联动函数返回 patch，继续入队处理，直到队列耗尽或达到保护上限。
 *
 * 函数本身不触发 Vue emit，只返回最终行和字段变更列表，便于主组件统一提交。
 */
export function resolveRowChange(
  context: ResolveRowChangeContext,
  options: ResolveRowChangeOptions = {}
): ResolvedRowChange {
  const { rowIndex, currentRow, formData, getFieldConfig } = context
  let nextRow = currentRow
  const nextTableData = [...(options.tableData || context.tableData)]
  nextTableData[rowIndex] = nextRow
  const fieldChanges = new Map<string, FormTableFieldChangePayload>()
  const pendingChanges: FormTableFieldChangePayload[] = []

  /**
   * 记录字段变更并维护最终派发 payload。
   *
   * 同一字段在一条联动链中可能被多次更新，这里会保留初始 previousValue
   * 和最终 value；如果最终值回到初始值，则取消这条变更。
   */
  const queueFieldChange = (fieldKey: string, value: any, previousValue: any) => {
    if (Object.is(previousValue, value)) {
      return
    }

    const currentChange = fieldChanges.get(fieldKey)
    const initialPreviousValue = currentChange?.previousValue ?? previousValue

    if (Object.is(initialPreviousValue, value)) {
      fieldChanges.delete(fieldKey)
    } else {
      fieldChanges.set(fieldKey, {
        row: nextRow,
        index: rowIndex,
        fieldKey,
        value,
        previousValue: initialPreviousValue
      })
    }

    pendingChanges.push({
      row: nextRow,
      index: rowIndex,
      fieldKey,
      value,
      previousValue
    })
  }

  /**
   * 以不可变方式把 patch 应用到当前行。
   *
   * patch key 支持 `profile.city` 这类路径写法，所以不能直接 Object.assign。
   */
  const applyPatch = (patch?: Partial<TableRow>) => {
    if (!patch) {
      return
    }

    Object.keys(patch).forEach((fieldKey) => {
      const value = patch[fieldKey]
      const previousValue = getValueByPath(nextRow, fieldKey)

      if (Object.is(previousValue, value)) {
        return
      }

      nextRow = setValueByPath(nextRow, fieldKey, value)
      nextTableData[rowIndex] = nextRow
      queueFieldChange(fieldKey, value, previousValue)
    })
  }

  applyPatch(options.initialPatch)
  ;(options.initialChanges || []).forEach((change) => {
    queueFieldChange(change.fieldKey, change.value, change.previousValue)
  })

  let processedCount = 0
  const maxLinkedChanges = 100

  // 防止互相联动的字段形成无限循环，超过上限后丢弃剩余联动。
  while (pendingChanges.length > 0 && processedCount < maxLinkedChanges) {
    const change = pendingChanges.shift()!
    const fieldConfig = getFieldConfig(change.fieldKey)
    const onValueChange = fieldConfig ? getFormItemOnValueChange(fieldConfig) : undefined

    if (!onValueChange) {
      processedCount += 1
      continue
    }

    const linkedPatch = onValueChange(
      createFieldChangeContext(
        rowIndex,
        nextRow,
        change.fieldKey,
        change.value,
        change.previousValue,
        nextTableData,
        formData
      )
    )

    if (linkedPatch) {
      applyPatch(linkedPatch)
    }
    processedCount += 1
  }

  if (pendingChanges.length > 0) {
    console.warn('[FormTable] onValueChange exceeded max linked update count, remaining changes were ignored.')
  }

  const resolvedFieldChanges = Array.from(fieldChanges.values()).map((change) => ({
    ...change,
    row: nextRow
  }))

  return {
    nextRow,
    fieldChanges: resolvedFieldChanges
  }
}
