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

// 只保留常用、稳定、在当前组件中最常见的 table 级属性。
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

export function extractFormAttrs<T extends Record<string, any>>(attrs: T) {
  return pick(attrs, EL_FORM_PROPS as any)
}

export function extractTableAttrs<T extends Record<string, any>>(attrs: T) {
  return pick(attrs, EL_TABLE_PROPS as any)
}
