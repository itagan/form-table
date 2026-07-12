export type FormTableValue = any
export type FormTableRecord = Record<string, FormTableValue>
export type ComponentBind = Record<string, FormTableValue>
export type FormTableCustomComponent = string | object

/**
 * 表格行数据结构，键值对形式，key 对应 FormItemConfig.key
 */
export interface TableRow extends FormTableRecord {}

/**
 * 自定义组件注册项，通过 props.customComponents 传入
 */
export interface CustomComponentConfig {
  name: string
  component: FormTableCustomComponent
}

export type CustomComponentsMap = Record<string, FormTableCustomComponent>

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
export type FormTableListenerArgs = unknown[]
export type FormTableFieldListener = (context: FormTableFieldContext, ...args: FormTableListenerArgs) => void
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
  name?: FormTableCustomComponent
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

export interface FormItemConfig {
  key: string
  type: FormItemType
  /** 常用组件属性可以直接配置在顶层，适合大多数简单字段。 */
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  readonly?: boolean
  options?: DynamicValue<FormItemOption[]>
  optionProps?: DynamicValue<OptionPropsConfig>
  /** 简单必填校验优先使用 required；复杂校验再使用字段 rules。 */
  required?: boolean
  requiredMessage?: string
  trigger?: string | string[]
  /** 字段级布局配置，例如 span 或 el-col props。 */
  layout?: FormItemLayoutConfig
  /** 组件私有配置，例如 component.bind、listeners、slotName 或 custom 组件名。 */
  component?: FormItemComponentConfig
  /** 展示态配置，例如 tooltip、formatter、emptyText。 */
  display?: FormItemDisplayConfig
  /** 运行时行为配置，例如显隐、默认值和字段联动。 */
  behavior?: FormItemBehaviorConfig
  /** 字段自身的完整 Element UI rules；适合单字段复杂校验。 */
  rules?: ValidationRule[]
  label?: string
  labelWidth?: string
}

export interface RowConfig {
  key?: string
  visible?: DynamicValue<boolean>
  bind?: DynamicValue<ComponentBind>
  props?: DynamicValue<ComponentBind>
  gutter?: number
  children: FormItemConfig[]
}

/**
 * 列配置 - 对应 el-table-column。
 * 简单单行单元格优先使用 fields；需要配置这一行布局时补充 fieldRow。
 * 只有单元格内需要多行布局时，再使用 children。
 */
export interface ColumnConfig {
  key?: string
  name: string
  required?: boolean
  headerSlot?: string
  visible?: DynamicValue<boolean>
  props?: DynamicValue<ComponentBind>
  /** fields 自动生成的单行 RowConfig 配置，例如 gutter、justify、align。 */
  fieldRow?: Omit<RowConfig, 'children'>
  /** 推荐的简单配置入口：一列里只有一行字段时使用。 */
  fields?: FormItemConfig[]
  /** 高级布局入口：一列里需要多行字段时使用。 */
  children?: RowConfig[]
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
  /** 集中式 rules，适合跨行通配或统一维护；动态行推荐使用 tableData.*.fieldKey。 */
  rules?: Record<string, ValidationRule[]>
  formData?: FormTableRecord
  customComponents?: CustomComponentConfig[]
  loading?: boolean
}

export interface FormTableEventPayload {
  type: string
  args: FormTableValue[]
}

export type FormTableValidationErrors = unknown[]

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

export interface FormTableHeaderSlotContext {
  column: ColumnConfig
  columnIndex: number
  label: string
  required: boolean
  formData: FormTableRecord
  tableData: TableRow[]
}

export type FormTableSlotFn<T = FormTableValue> = (slotProps: T) => FormTableValue
export type FormTableSlots = Record<string, FormTableSlotFn | undefined>

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
 * 内部持有的 Element UI Form 实例能力边界。
 *
 * FormTable 只依赖这些方法做整体校验、字段校验和校验状态清理，
 * 避免 composable 直接透传宽泛的 `any`。
 */
export interface FormTableElementFormRef {
  validate?: () => Promise<boolean> | boolean
  validateField?: (
    fieldProp: string,
    callback: (message: string) => void
  ) => void
  resetFields?: () => void
  clearValidate?: (fieldProps?: string | string[]) => void
}

/**
 * 内部持有的 Element UI Table 实例能力边界。
 *
 * 这里只列出 FormTable 直接透出的常用原生方法；业务侧仍可通过
 * getNativeTableRef 获取完整实例能力。
 */
export interface FormTableElementTableRef {
  clearSelection?: () => void
  toggleRowSelection?: (row: TableRow, selected?: boolean) => void
  toggleAllSelection?: () => void
  toggleRowExpansion?: (row: TableRow, expanded?: boolean) => void
  setCurrentRow?: (row?: TableRow) => void
  clearSort?: () => void
  clearFilter?: (columnKeys?: string[]) => void
  doLayout?: () => void
  sort?: (prop: string, order: 'ascending' | 'descending' | null) => void
}

/**
 * FormTable 通过 ref 暴露给业务侧的公开方法。
 *
 * 保持接近 Element UI Form 的使用习惯，同时补充表格行操作和数据读写能力。
 */
export interface FormTableExpose {
  validate: (callback?: (valid: boolean, errors: FormTableValidationErrors) => void) => Promise<boolean>
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
  clearSelection: () => void
  toggleRowSelection: (row: TableRow, selected?: boolean) => void
  toggleAllSelection: () => void
  toggleRowExpansion: (row: TableRow, expanded?: boolean) => void
  setCurrentRow: (row?: TableRow) => void
  clearSort: () => void
  clearFilter: (columnKeys?: string[]) => void
  doLayout: () => void
  sort: (prop: string, order: 'ascending' | 'descending' | null) => void
  getNativeFormRef: () => FormTableElementFormRef | null
  getNativeTableRef: () => FormTableElementTableRef | null
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
  'validate': [valid: boolean, errors: FormTableValidationErrors]
  'select': [selection: TableRow[], row: TableRow]
  'select-all': [selection: TableRow[]]
  'selection-change': [selection: TableRow[]]
  'cell-mouse-enter': [row: TableRow, column: FormTableValue, cell: HTMLElement, event: Event]
  'cell-mouse-leave': [row: TableRow, column: FormTableValue, cell: HTMLElement, event: Event]
  'cell-click': [row: TableRow, column: FormTableValue, cell: HTMLElement, event: Event]
  'cell-dblclick': [row: TableRow, column: FormTableValue, cell: HTMLElement, event: Event]
  'row-click': [row: TableRow, column: FormTableValue, event: Event]
  'row-contextmenu': [row: TableRow, column: FormTableValue, event: Event]
  'row-dblclick': [row: TableRow, column: FormTableValue, event: Event]
  'header-click': [column: FormTableValue, event: Event]
  'header-contextmenu': [column: FormTableValue, event: Event]
  'sort-change': [payload: FormTableValue]
  'filter-change': [filters: FormTableValue]
  'current-change': [currentRow: TableRow | null, oldCurrentRow: TableRow | null]
  'header-dragend': [newWidth: number, oldWidth: number, column: FormTableValue, event: Event]
  'expand-change': [row: TableRow, expandedRows: TableRow[]]
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
    value: FormTableValue
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
