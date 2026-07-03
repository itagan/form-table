export type FormTableValue = any
export type FormTableRecord = Record<string, FormTableValue>
export type ComponentBind = Record<string, any>

/**
 * 表格行数据结构，键值对形式，key 对应 FormItemConfig.key
 */
export interface TableRow extends FormTableRecord {}

/**
 * 自定义组件注册项，通过 props.customComponents 传入
 */
export interface CustomComponentConfig {
  name: string
  component: any
}

export type CustomComponentsMap = Record<string, any>

export interface FormTableBaseContext {
  formData: FormTableRecord
  tableData: TableRow[]
}

export interface FormTableRuntimeContext extends FormTableBaseContext {
  row: TableRow
  index: number
  fieldKey?: string
}

export interface FormTableFieldContext extends FormTableRuntimeContext {
  value: FormTableValue
  setValue: (value: FormTableValue) => void
  updateRow: (patch: Partial<TableRow>) => void
}

export interface FormTableFieldChangeContext extends FormTableRuntimeContext {
  value: FormTableValue
  previousValue: FormTableValue
  getValue: (path: string) => FormTableValue
}

export type DynamicValue<T> = T | ((context: FormTableRuntimeContext) => T)
export type FormTableFieldListener = (context: FormTableFieldContext, ...args: any[]) => void
export type FormTableFieldChangeHandler = (context: FormTableFieldChangeContext) => Partial<TableRow> | void

export interface FormItemOption {
  label?: FormTableValue
  value?: FormTableValue
  disabled?: boolean
  [key: string]: FormTableValue
}

export interface OptionPropsConfig {
  label?: string
  value?: string
  disabled?: string
  key?: string
}

export interface FormItemLayoutConfig {
  span?: number | string
  colProps?: DynamicValue<ComponentBind>
}

export interface FormItemComponentConfig {
  customComponent?: string
  slotName?: string
  bind?: DynamicValue<ComponentBind>
  listeners?: Record<string, FormTableFieldListener>
  options?: DynamicValue<FormItemOption[]>
  optionProps?: DynamicValue<OptionPropsConfig>
}

export interface FormItemTooltipConfig {
  enabled?: boolean
  props?: DynamicValue<ComponentBind>
}

export interface FormItemDisplayConfig {
  tooltip?: boolean | FormItemTooltipConfig
  formatter?: (value: FormTableValue, context: FormTableRuntimeContext) => FormTableValue
  emptyText?: string
}

export interface FormItemBehaviorConfig {
  visible?: DynamicValue<boolean>
  defaultValue?: DynamicValue<FormTableValue>
  onValueChange?: FormTableFieldChangeHandler
}

/**
 * 支持的表单项类型
 * - 基础输入: input, textarea, number
 * - 选择类: select, radio, checkbox, switch, cascader, tree-select
 * - 日期时间: date, datetime, time
 * - 特殊: rate, slider, color, upload, autocomplete, tag-input
 * - 扩展: text(纯文本展示), slot(插槽渲染), custom(自定义组件)
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
  | 'slot'
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
 * 表单项配置 - 结构能力按职责分组，组件属性统一放到 component.bind
 */
export interface FormItemConfig {
  key: string
  type: FormItemType
  layout?: FormItemLayoutConfig
  component?: FormItemComponentConfig
  display?: FormItemDisplayConfig
  behavior?: FormItemBehaviorConfig
  rules?: any[]
  label?: string
  labelWidth?: string
}

/**
 * 行配置 - 对应 el-row，包含多个表单项（el-col）
 */
export interface RowConfig {
  key?: string
  visible?: DynamicValue<boolean>
  bind?: DynamicValue<ComponentBind>
  props?: DynamicValue<ComponentBind>
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
  props?: DynamicValue<ComponentBind>
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
  validator?: (
    rule: ValidationRule,
    value: FormTableValue,
    callback: (error?: Error | string) => void
  ) => void
  pattern?: RegExp
  len?: number
  [key: string]: FormTableValue
}

/**
 * 组件 Props 聚合类型（供外部类型标注使用）
 */
export interface FormTableProps {
  tableData: TableRow[]
  columns: ColumnConfig[]
  rules: Record<string, ValidationRule[]>
  formData: FormTableRecord
  customComponents?: CustomComponentConfig[]
  loading?: boolean
}

export interface FormTableEventPayload {
  type: string
  args: FormTableValue[]
}

export interface FormTableFieldChangePayload {
  row: TableRow
  index: number
  fieldKey: string
  value: FormTableValue
  previousValue: FormTableValue
}

export interface FormTableSlotContext {
  row: TableRow
  index: number
  rowCount: number
  isFirstRow: boolean
  isLastRow: boolean
  fieldKey: string
  propPath: string
  value: FormTableValue
  formData: FormTableRecord
  tableData: TableRow[]
  setValue: (value: FormTableValue) => void
  updateRow: (patch: Partial<TableRow>) => void
  removeCurrentRow: () => void
  copyCurrentRow: (patch?: Partial<TableRow>) => void
  insertBefore: (rowData?: Partial<TableRow>) => void
  insertAfter: (rowData?: Partial<TableRow>) => void
  moveCurrentRow: (toIndex: number) => void
  moveUp: () => void
  moveDown: () => void
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

/**
 * FormTable 通过 ref 暴露给业务侧的公开方法。
 *
 * 保持接近 Element UI Form 的使用习惯，同时补充表格行操作和数据读写能力。
 */
export interface FormTableExpose {
  validate: (callback?: (valid: boolean, errors: any[]) => void) => Promise<boolean>
  resetFields: () => void
  validateField: (fieldProp: string | string[]) => Promise<boolean>
  validateRow: (index: number) => Promise<boolean>
  clearValidate: (fieldProps?: string | string[]) => void
  addRow: (rowData?: Partial<TableRow>) => void
  insertRow: (index: number, rowData?: Partial<TableRow>) => void
  copyRow: (index: number, patch?: Partial<TableRow>) => void
  updateRow: (index: number, patch: Partial<TableRow>) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  getRow: (index: number) => TableRow | undefined
  removeRow: (index: number) => void
  getFormData: () => FormTableRecord
  setFormData: (data: FormTableRecord) => void
}

export interface FormTableEmits {
  'update:tableData': [data: TableRow[]]
  'update:formData': [data: FormTableRecord]
  'field-change': [payload: FormTableFieldChangePayload]
  'row-add': [row: TableRow, index: number]
  'row-copy': [row: TableRow, index: number]
  'row-update': [row: TableRow, index: number]
  'row-move': [row: TableRow, fromIndex: number, toIndex: number]
  'row-remove': [row: TableRow, index: number]
  'validate': [valid: boolean, errors: any[]]
  'event': [payload: FormTableEventPayload]
}

export type FormTableEventName = keyof FormTableEmits
export type FormTableArchivedEventName = Exclude<FormTableEventName, 'event'>
export type FormTableEmitFn = <K extends FormTableEventName>(
  event: K,
  ...args: FormTableEmits[K]
) => void

export interface FormTableInternalCommandPayloads {
  'update:row': [
    rowIndex: number,
    row: TableRow,
    fieldKey: string,
    value: any
  ]
  'update:row-data': [
    rowIndex: number,
    patch: Partial<TableRow>
  ]
}

export type FormTableInternalCommandName = keyof FormTableInternalCommandPayloads
export type FormTablePublicDispatchEventName = FormTableArchivedEventName

// provide/inject keys - 使用 Symbol 保证类型安全
export type DispatchFn = {
  <K extends FormTableInternalCommandName>(
    type: K,
    ...args: FormTableInternalCommandPayloads[K]
  ): void
  <K extends FormTablePublicDispatchEventName>(
    type: K,
    ...args: FormTableEmits[K]
  ): void
}

export const FORM_TABLE_CUSTOM_COMPONENTS_KEY: unique symbol = Symbol('customComponents')
export const FORM_TABLE_CONTEXT_KEY: unique symbol = Symbol('formTableContext')
export const FORM_TABLE_ACTIONS_KEY: unique symbol = Symbol('formTableActions')
export const FORM_TABLE_DISPATCH_KEY: unique symbol = Symbol('dispatch')
export const FORM_TABLE_RULES_KEY: unique symbol = Symbol('rules')
export const FORM_TABLE_SLOTS_KEY: unique symbol = Symbol('formTableSlots')
