import type { TableRow } from './types/base'
import type {
  ColumnConfig,
  EmptyFieldTypeRegistry,
  FieldTypeRegistry
} from './types/config'

/**
 * 为配置式列提供业务行类型上下文；运行时原样返回传入数组。
 */
export function defineFormTableColumns<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
>(
  columns: ColumnConfig<TRow, TFieldTypes>[]
): ColumnConfig<TRow, TFieldTypes>[] {
  return columns
}
