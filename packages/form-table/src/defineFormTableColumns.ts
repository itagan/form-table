import type { TableRow } from './types/base'
import type { ColumnConfig } from './types/config'

/**
 * 为配置式列提供业务行类型上下文；运行时原样返回传入数组。
 */
export function defineFormTableColumns<TRow extends TableRow = TableRow>(
  columns: ColumnConfig<TRow>[]
): ColumnConfig<TRow>[] {
  return columns
}
