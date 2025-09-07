/**
 * 属性处理工具函数
 */

/**
 * 从对象中提取指定的属性
 * @param obj 源对象
 * @param keys 要提取的属性名数组
 * @returns 包含指定属性的新对象
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * 从对象中排除指定的属性
 * @param obj 源对象
 * @param keys 要排除的属性名数组
 * @returns 不包含指定属性的新对象
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result
}

/**
 * el-form 支持的属性列表
 */
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

/**
 * el-table 支持的属性列表
 */
export const EL_TABLE_PROPS = [
  'border',
  'stripe',
  'size',
  'showHeader',
  'highlightCurrentRow',
  'rowKey',
  'defaultSort',
  'height',
  'maxHeight',
  'fit',
  'showSummary',
  'sumText',
  'summaryMethod',
  'spanMethod',
  'rowClassName',
  'rowStyle',
  'cellClassName',
  'cellStyle',
  'headerRowClassName',
  'headerRowStyle',
  'headerCellClassName',
  'headerCellStyle',
  'emptyText',
  'defaultExpandAll',
  'expandRowKeys',
  'defaultSortOrders',
  'tooltipEffect',
  'showOverflowTooltip',
  'rowSelection',
  'lazy',
  'load',
  'treeProps',
  'indent',
  'currentRowKey',
  'selectOnIndeterminate',
  'selectable',
  'reserveSelection',
  'sortBy',
  'sortOrders',
  'sortMethod',
  'sortChange',
  'filterMethod',
  'filters',
  'filterPlacement',
  'filterMultiple',
  'filterValue',
  'filterChange',
  'currentChange',
  'headerDragend',
  'expandChange',
  'selectionChange',
  'cellMouseEnter',
  'cellMouseLeave',
  'cellClick',
  'cellDblclick',
  'rowClick',
  'rowDblclick',
  'rowContextmenu',
  'headerClick',
  'headerContextmenu',
  'sortChange',
  'filterChange',
  'currentChange',
  'headerDragend',
  'expandChange',
  'selectionChange'
] as const

/**
 * FormTable 特有的属性列表
 */
export const FORM_TABLE_PROPS = [
  'tableData',
  'columns',
  'rules',
  'formData',
  'customComponents',
  'loading'
] as const

/**
 * 提取 el-form 相关的属性
 */
export function extractFormAttrs<T extends Record<string, any>>(attrs: T) {
  return pick(attrs, EL_FORM_PROPS as any)
}

/**
 * 提取 el-table 相关的属性
 */
export function extractTableAttrs<T extends Record<string, any>>(attrs: T) {
  return pick(attrs, EL_TABLE_PROPS as any)
}

/**
 * 提取 FormTable 特有的属性
 */
export function extractFormTableAttrs<T extends Record<string, any>>(attrs: T) {
  return pick(attrs, FORM_TABLE_PROPS as any)
}
