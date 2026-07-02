import type {
  ColumnConfig,
  DynamicValue,
  FormTableBaseContext,
  FormTableRuntimeContext,
  TableRow
} from '../types'
import { applyRowPatch, getValueByPath, setValueByPath } from './path'

/**
 * 创建动态配置函数的运行上下文。
 *
 * 动态配置可能出现在列、行、字段和组件属性上；缺省 row/index 使用空值，
 * 让列级配置也可以复用同一套上下文结构。
 */
export function createRuntimeContext(
  baseContext: FormTableBaseContext,
  overrides: Partial<FormTableRuntimeContext> = {}
): FormTableRuntimeContext {
  return {
    formData: baseContext.formData,
    tableData: baseContext.tableData,
    row: overrides.row || {},
    index: overrides.index ?? -1,
    fieldKey: overrides.fieldKey
  }
}

/**
 * 解析支持函数写法的配置值。
 *
 * 如果 value 是函数，会把当前运行上下文传入；否则直接返回静态值。
 */
export function resolveDynamicValue<T>(
  value: DynamicValue<T> | undefined,
  context: FormTableRuntimeContext
): T | undefined {
  if (typeof value === 'function') {
    return (value as (context: FormTableRuntimeContext) => T)(context)
  }

  return value
}

/**
 * 解析显隐配置。
 *
 * 只有显式返回 false 时才视为隐藏，undefined/null/true 都保持可见。
 */
export function resolveVisible(
  value: DynamicValue<boolean> | undefined,
  context: FormTableRuntimeContext
): boolean {
  return resolveDynamicValue(value, context) !== false
}

/**
 * 根据 columns 配置构造一条新行的默认数据。
 *
 * `seed` 会先写入草稿行，随后只为未设置的可见字段补 `behavior.defaultValue`。
 * 字段 key 支持路径写法，因此写入时通过 path 工具保持不可变更新。
 */
export function buildDefaultRow(
  columns: ColumnConfig[],
  baseContext: FormTableBaseContext,
  rowIndex: number,
  seed: Partial<TableRow> = {}
): TableRow {
  const draftRow: TableRow = applyRowPatch({}, seed)

  columns.forEach((column) => {
    const columnContext = createRuntimeContext(baseContext, {
      row: draftRow,
      index: rowIndex
    })

    if (!resolveVisible(column.visible, columnContext)) {
      return
    }

    column.children.forEach((rowConfig) => {
      const rowContext = createRuntimeContext(baseContext, {
        row: draftRow,
        index: rowIndex
      })

      if (!resolveVisible(rowConfig.visible, rowContext)) {
        return
      }

      rowConfig.children.forEach((item) => {
        const itemContext = createRuntimeContext(baseContext, {
          row: draftRow,
          index: rowIndex,
          fieldKey: item.key
        })

        if (!resolveVisible(item.behavior?.visible, itemContext)) {
          return
        }

        if (getValueByPath(draftRow, item.key) !== undefined) {
          return
        }

        const defaultValue = resolveDynamicValue(item.behavior?.defaultValue, itemContext)
        if (defaultValue !== undefined) {
          Object.assign(draftRow, setValueByPath(draftRow, item.key, defaultValue))
        }
      })
    })
  })

  return draftRow
}
