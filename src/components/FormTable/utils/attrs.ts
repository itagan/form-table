/**
 * attrs 工具模块
 *
 * 从组件透传的 $attrs 中按白名单提取 el-form / el-table / el-table-column 可用属性，
 * 避免非法属性传递到 DOM 引发警告。
 */

/** 从对象中选取指定键（忽略 undefined） */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  })
  return result
}

function kebabToCamelCase(value: string): string {
  return value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

export function normalizeAttrs<T extends Record<string, any>>(attrs: T): Record<string, any> {
  const normalized: Record<string, any> = {}

  Object.keys(attrs).forEach((key) => {
    normalized[kebabToCamelCase(key)] = attrs[key]
  })

  return normalized
}

/** el-form 支持的属性白名单 */
export const EL_FORM_PROPS = [
  'labelWidth',
  'labelPosition',
  'labelSuffix',
  'hideRequiredAsterisk',
  'showMessage',
  'inlineMessage',
  'statusIcon',
  'validateOnRuleChange',
  'size',
  'disabled'
] as const

/** el-table 支持的属性白名单（只保留常用、稳定的属性） */
export const EL_TABLE_PROPS = [
  'border',
  'stripe',
  'size',
  'height',
  'maxHeight',
  'fit',
  'showHeader',
  'showSummary',
  'sumText',
  'summaryMethod',
  'rowKey',
  'rowClassName',
  'rowStyle',
  'cellClassName',
  'cellStyle',
  'headerRowClassName',
  'headerRowStyle',
  'headerCellClassName',
  'headerCellStyle',
  'highlightCurrentRow',
  'emptyText',
  'defaultExpandAll',
  'expandRowKeys',
  'treeProps',
  'lazy',
  'load',
  'spanMethod',
  'tooltipEffect',
  'showOverflowTooltip'
] as const

/** el-table-column 支持的属性白名单 */
export const EL_COLUMN_PROPS = [
  'type',
  'index',
  'columnKey',
  'width',
  'minWidth',
  'fixed',
  'sortable',
  'sortMethod',
  'sortBy',
  'sortOrders',
  'resizable',
  'formatter',
  'showOverflowTooltip',
  'align',
  'headerAlign',
  'className',
  'labelClassName',
  'selectable',
  'reserveSelection',
  'filters',
  'filterPlacement',
  'filterMultiple',
  'filterMethod',
  'filteredValue'
] as const

export function extractFormAttrs<T extends Record<string, any>>(attrs: T) {
  return pick(normalizeAttrs(attrs), EL_FORM_PROPS as any)
}

export function extractTableAttrs<T extends Record<string, any>>(attrs: T) {
  return pick(normalizeAttrs(attrs), EL_TABLE_PROPS as any)
}

export function extractColumnAttrs<T extends Record<string, any>>(attrs: T) {
  return pick(normalizeAttrs(attrs), EL_COLUMN_PROPS as any)
}
