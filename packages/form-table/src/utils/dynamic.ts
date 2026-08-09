import type {
  ColumnConfig,
  DynamicValue,
  FormItemConfig,
  FormTableColumnContext,
  FormTableFieldRenderContext,
  FormTableRowContext,
  FormTableTableContext,
  RowConfig,
  TableRow
} from '../types'
import { getValueByPath } from './path'

/**
 * 以可枚举 getter 转发上层上下文，扩展时不会提前读取任何响应式属性。
 */
export function extendLazyContext<Base extends object, Extension extends object>(
  base: Base,
  extension: Extension
): Base & Extension {
  const context = {}
  Object.keys(base).forEach(key => {
    Object.defineProperty(context, key, {
      configurable: true,
      enumerable: true,
      get: () => base[key as keyof Base]
    })
  })
  Object.getOwnPropertyNames(extension).forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(extension, key)
    if (descriptor) Object.defineProperty(context, key, descriptor)
  })
  return context as Base & Extension
}

/**
 * 分层构造动态配置上下文，使列、行、字段回调只看到其所在层级的数据。
 */
export function createTableContext(
  getTableData: () => ReadonlyArray<TableRow>
): FormTableTableContext {
  return {
    get tableData() {
      return getTableData()
    }
  }
}

/** 在表级上下文上附加当前列配置。 */
export function createColumnContext(
  tableContext: FormTableTableContext,
  columnConfig: Readonly<ColumnConfig>
): FormTableColumnContext {
  return extendLazyContext(tableContext, {
    columnConfig
  })
}

/** 在列级上下文上附加当前数据行、下标和布局行配置。 */
export function createRowContext(
  columnContext: FormTableColumnContext,
  row: Readonly<TableRow>,
  index: number,
  rowConfig: Readonly<RowConfig>
): FormTableRowContext {
  return extendLazyContext(columnContext, {
    row,
    index,
    rowConfig
  })
}

/** 在行级上下文上读取字段值并附加当前字段配置。 */
export function createFieldRenderContext(
  rowContext: FormTableRowContext,
  itemConfig: Readonly<FormItemConfig>
): FormTableFieldRenderContext {
  return extendLazyContext(rowContext, {
    fieldKey: itemConfig.fieldKey,
    get value() {
      return getValueByPath(rowContext.row, itemConfig.fieldKey)
    },
    itemConfig
  })
}

/** 统一求值静态配置和基于上下文的动态配置函数。 */
export function resolveDynamicValue<T, Context>(
  value: DynamicValue<T, Context> | undefined,
  context: Context
): T | undefined {
  return typeof value === 'function'
    ? (value as (context: Context) => T)(context)
    : value
}

/** 只有显式返回 false 才隐藏，未配置和 undefined 均保持可见。 */
export function resolveVisible<Context>(
  value: DynamicValue<boolean, Context> | undefined,
  context: Context
) {
  return resolveDynamicValue(value, context) !== false
}
