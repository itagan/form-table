import type { ColumnConfig, FormItemConfig } from '@itagan/form-table'

export type FormItemEnhancement = (item: FormItemConfig) => FormItemConfig

/**
 * 业务层按 fieldKey 增强远程 JSON；核心组件无需了解组件注册表或事件名称映射。
 */
export function enhanceFormTableColumns(
  columns: ColumnConfig[],
  enhancements: Record<string, FormItemEnhancement>
): ColumnConfig[] {
  return columns.map((column) => ({
    ...column,
    children: column.children.map((row) => ({
      ...row,
      children: row.children.map((item) => enhancements[item.fieldKey]?.(item) || item)
    }))
  }))
}
