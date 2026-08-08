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

export function createTableContext(
  tableData: ReadonlyArray<TableRow>
): FormTableTableContext {
  return { tableData }
}

export function createColumnContext(
  tableContext: FormTableTableContext,
  columnConfig: Readonly<ColumnConfig>
): FormTableColumnContext {
  return {
    ...tableContext,
    columnConfig
  }
}

export function createRowContext(
  columnContext: FormTableColumnContext,
  row: Readonly<TableRow>,
  index: number,
  rowConfig: Readonly<RowConfig>
): FormTableRowContext {
  return {
    ...columnContext,
    row,
    index,
    rowConfig
  }
}

export function createFieldRenderContext(
  rowContext: FormTableRowContext,
  itemConfig: Readonly<FormItemConfig>
): FormTableFieldRenderContext {
  return {
    ...rowContext,
    fieldKey: itemConfig.fieldKey,
    value: getValueByPath(rowContext.row, itemConfig.fieldKey),
    itemConfig
  }
}

export function resolveDynamicValue<T, Context>(
  value: DynamicValue<T, Context> | undefined,
  context: Context
): T | undefined {
  return typeof value === 'function'
    ? (value as (context: Context) => T)(context)
    : value
}

export function resolveVisible<Context>(
  value: DynamicValue<boolean, Context> | undefined,
  context: Context
) {
  return resolveDynamicValue(value, context) !== false
}
