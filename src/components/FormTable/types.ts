/**
 * 表格行数据结构，键值对形式，key 对应 FormItemConfig.key
 */
export interface TableRow {
  [key: string]: any
}

/**
 * 自定义组件注册项，通过 props.customComponents 传入
 */
export interface CustomComponentConfig {
  name: string
  component: any
}

export interface FormTableBaseContext {
  formData: Record<string, any>
  tableData: TableRow[]
}

export interface FormTableRuntimeContext extends FormTableBaseContext {
  row: TableRow
  index: number
  fieldKey?: string
}

export type DynamicValue<T> = T | ((context: FormTableRuntimeContext) => T)

export interface FormItemOption {
  label?: any
  value?: any
  disabled?: boolean
  [key: string]: any
}

export interface OptionPropsConfig {
  label?: string
  value?: string
  disabled?: string
  key?: string
}

/**
 * 支持的表单项类型
 * - 基础输入: input, textarea, number
 * - 选择类: select, radio, checkbox, switch, cascader, tree-select
 * - 日期时间: date, datetime, time
 * - 特殊: rate, slider, color, upload, autocomplete, tag-input
 * - 扩展: text(纯文本展示), slotComponent(插槽渲染), custom(自定义组件)
 */
export type FormItemType =
  | 'input'
  | 'select'
  | 'date'
  | 'datetime'
  | 'time'
  | 'textarea'
  | 'number'
  | 'switch'
  | 'radio'
  | 'checkbox'
  | 'text'
  | 'slotComponent'
  | 'custom'
  | 'rate'
  | 'slider'
  | 'color'
  | 'upload'
  | 'cascader'
  | 'tree-select'
  | 'autocomplete'
  | 'tag-input'

/**
 * 表单项配置 - 常用字段直接声明，非常见配置通过 bind 透传给具体 Element 组件
 */
export interface FormItemConfig {
  key: string
  type: FormItemType
  visible?: DynamicValue<boolean>
  colSpan?: number | string
  colProps?: Record<string, any>
  bind?: Record<string, any>
  rules?: any[]
  label?: string
  labelWidth?: string
  isUseTooltip?: boolean
  tooltipProps?: Record<string, any>
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  size?: 'large' | 'default' | 'small'
  customComponent?: string
  slotName?: string
  options?: FormItemOption[]
  optionProps?: OptionPropsConfig
  remote?: boolean
  remoteMethod?: Function
  min?: number
  max?: number
  step?: number
  format?: string
  valueFormat?: string
  props?: Record<string, any>
  data?: any[]
  fetchSuggestions?: Function
  action?: string
  rows?: number
  defaultValue?: DynamicValue<any>
  formatter?: (value: any, context: FormTableRuntimeContext) => any
  emptyText?: string
}

/**
 * 行配置 - 对应 el-row，包含多个表单项（el-col）
 */
export interface RowConfig {
  key?: string
  visible?: DynamicValue<boolean>
  bind?: Record<string, any>
  props?: Record<string, any>
  gutter?: number
  children: FormItemConfig[]
}

/**
 * 列配置 - 对应 el-table-column，内含多行布局
 */
export interface ColumnConfig {
  key?: string
  name: string
  visible?: DynamicValue<boolean>
  props?: Record<string, any>
  children: RowConfig[]
}

/**
 * 校验规则，兼容 el-form rules 格式
 * propPath 格式: `tableData.${rowIndex}.${fieldKey}`
 */
export interface ValidationRule {
  required?: boolean
  type?: string
  min?: number
  max?: number
  message?: string
  trigger?: string | string[]
  validator?: (rule: any, value: any, callback: Function) => void
  pattern?: RegExp
  len?: number
  [key: string]: any
}

/**
 * 组件 Props 聚合类型（供外部类型标注使用）
 */
export interface FormTableProps {
  tableData: TableRow[]
  columns: ColumnConfig[]
  rules: Record<string, ValidationRule[]>
  formData: Record<string, any>
  customComponents?: CustomComponentConfig[]
  loading?: boolean
}

export interface FormTableEventPayload {
  type: string
  args: any[]
}

export interface FormTableSlotContext {
  row: TableRow
  index: number
  fieldKey: string
  propPath: string
  value: any
  formData: Record<string, any>
  tableData: TableRow[]
  setValue: (value: any) => void
  updateRow: (patch: Record<string, any>) => void
  removeCurrentRow: () => void
  copyCurrentRow: (patch?: Partial<TableRow>) => void
  insertBefore: (rowData?: Partial<TableRow>) => void
  insertAfter: (rowData?: Partial<TableRow>) => void
  validateCurrentField: () => Promise<boolean>
  validateCurrentRow: () => Promise<boolean>
  clearCurrentFieldValidate: () => void
  clearCurrentRowValidate: () => void
}

export interface FormTableActions {
  addRow: (rowData?: Partial<TableRow>) => void
  insertRow: (index: number, rowData?: Partial<TableRow>) => void
  copyRow: (index: number, patch?: Partial<TableRow>) => void
  updateRow: (index: number, patch: Partial<TableRow>) => void
  removeRow: (index: number) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  getRow: (index: number) => TableRow | undefined
  getRowFieldProps: (index: number) => string[]
  validateField: (fieldProp: string | string[]) => Promise<boolean>
  validateRow: (index: number) => Promise<boolean>
  clearValidate: (fieldProps?: string | string[]) => void
  clearRowValidate: (index: number) => void
}

export interface FormTableEmits {
  'update:tableData': [data: TableRow[]]
  'update:formData': [data: Record<string, any>]
  'row-add': [row: TableRow, index: number]
  'row-copy': [row: TableRow, index: number]
  'row-update': [row: TableRow, index: number]
  'row-move': [row: TableRow, fromIndex: number, toIndex: number]
  'row-remove': [row: TableRow, index: number]
  'validate': [valid: boolean, errors: any[]]
  'event': [payload: FormTableEventPayload]
}

// provide/inject keys - 使用 Symbol 保证类型安全
export type DispatchFn = (type: string, ...args: any[]) => void

export const FORM_TABLE_CUSTOM_COMPONENTS_KEY: unique symbol = Symbol('customComponents')
export const FORM_TABLE_CONTEXT_KEY: unique symbol = Symbol('formTableContext')
export const FORM_TABLE_ACTIONS_KEY: unique symbol = Symbol('formTableActions')
export const FORM_TABLE_DISPATCH_KEY: unique symbol = Symbol('dispatch')
export const FORM_TABLE_RULES_KEY: unique symbol = Symbol('rules')
export const FORM_TABLE_SLOTS_KEY: unique symbol = Symbol('formTableSlots')
