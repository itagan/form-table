import type { ColumnConfig, TableRow } from './types'

/**
 * 为配置式列提供业务行类型上下文；运行时原样返回传入数组。
 */
export function defineFormTableColumns<TRow extends TableRow = TableRow>(
  columns: ColumnConfig<TRow>[]
): ColumnConfig<TRow>[] {
  return columns
}
