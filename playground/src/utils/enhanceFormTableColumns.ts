import type { ColumnConfig, FormItemConfig, LayoutColumnConfig } from '@itagan/form-table'

export type FormItemEnhancement = (item: FormItemConfig) => FormItemConfig

const isLayoutColumn = (column: ColumnConfig): column is LayoutColumnConfig => (
  Array.isArray(column.formItems)
)

/**
 * 业务层按 fieldKey 增强远程 JSON；核心组件无需了解组件注册表或事件名称映射。
 */
export function enhanceFormTableColumns(
  columns: ColumnConfig[],
  enhancements: Record<string, FormItemEnhancement>
): ColumnConfig[] {
  return columns.map((column) => isLayoutColumn(column) ? ({
    ...column,
    formItems: column.formItems.map((item) => enhancements[item.fieldKey]?.(item) || item)
  }) : column)
}
