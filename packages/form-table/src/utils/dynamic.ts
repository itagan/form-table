import type {
  DynamicValue,
  FormTableFieldRenderContext,
  FormTableRowContext,
  FormTableTableContext,
  TableRow
} from '../types'
import { getValueByPath } from './path'

export function createTableContext(
  tableData: ReadonlyArray<TableRow>
): FormTableTableContext {
  return { tableData }
}

export function createRowContext(
  tableContext: FormTableTableContext,
  row: Readonly<TableRow>,
  index: number
): FormTableRowContext {
  return {
    ...tableContext,
    row,
    index
  }
}

export function createFieldRenderContext(
  rowContext: FormTableRowContext,
  fieldKey: string
): FormTableFieldRenderContext {
  return {
    ...rowContext,
    fieldKey,
    value: getValueByPath(rowContext.row, fieldKey)
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
