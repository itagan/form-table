// 表格行数据类型
export interface TableRow {
  [key: string]: any
}

// 自定义组件配置
export interface CustomComponentConfig {
  name: string
  component: any
  props?: Record<string, any>
  events?: Record<string, string>
}

// 插槽配置
export interface SlotConfig {
  name: string
  scope?: Record<string, any>
}

// 组件类型定义
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

// 基础表单项配置
export interface BaseFormItemConfig {
  key: string
  type: FormItemType
  colSpan?: number | string
  bind?: Record<string, any>
  isUseTooltip?: boolean
  tooltipProps?: Record<string, any>
  rules?: any[]
  label?: string
  labelWidth?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  size?: 'large' | 'default' | 'small'
}

// 插槽组件配置
export interface SlotFormItemConfig extends BaseFormItemConfig {
  type: 'slotComponent'
  slotName: string
  slot?: SlotConfig
}

// 自定义组件配置
export interface CustomFormItemConfig extends BaseFormItemConfig {
  type: 'custom'
  customComponent: string
}

// 输入框组件配置
export interface InputFormItemConfig extends BaseFormItemConfig {
  type: 'input' | 'textarea'
  showPassword?: boolean
  showWordLimit?: boolean
  maxlength?: number
  minlength?: number
  prefixIcon?: string
  suffixIcon?: string
  autocomplete?: 'on' | 'off'
  name?: string
  id?: string
  tabindex?: string | number
  validateEvent?: boolean
  autosize?: boolean | { minRows?: number; maxRows?: number }
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
}

// 选择器组件配置
export interface SelectFormItemConfig extends BaseFormItemConfig {
  type: 'select'
  options?: Array<{ label: string; value: any; [key: string]: any }>
  multiple?: boolean
  filterable?: boolean
  remote?: boolean
  remoteMethod?: Function
  loading?: boolean
  noDataText?: string
  noMatchText?: string
  reserveKeyword?: boolean
  defaultFirstOption?: boolean
  popperClass?: string
  automaticDropdown?: boolean
}

// 数字输入框配置
export interface NumberFormItemConfig extends BaseFormItemConfig {
  type: 'number'
  min?: number
  max?: number
  step?: number
  showWordLimit?: boolean
  maxlength?: number
  minlength?: number
}

// 日期选择器配置
export interface DateFormItemConfig extends BaseFormItemConfig {
  type: 'date' | 'datetime' | 'time'
  format?: string
  valueFormat?: string
}

// 滑块组件配置
export interface SliderFormItemConfig extends BaseFormItemConfig {
  type: 'slider'
  min?: number
  max?: number
  step?: number
  showStops?: boolean
  showInput?: boolean
  range?: boolean
}

// 评分组件配置
export interface RateFormItemConfig extends BaseFormItemConfig {
  type: 'rate'
  max?: number
  showScore?: boolean
}

// 级联选择器配置
export interface CascaderFormItemConfig extends BaseFormItemConfig {
  type: 'cascader'
  options?: any[]
  props?: Record<string, any>
}

// 树形选择器配置
export interface TreeSelectFormItemConfig extends BaseFormItemConfig {
  type: 'tree-select'
  data?: any[]
  props?: Record<string, any>
}

// 自动完成组件配置
export interface AutocompleteFormItemConfig extends BaseFormItemConfig {
  type: 'autocomplete'
  fetchSuggestions?: Function
  triggerOnFocus?: boolean
}

// 标签输入组件配置
export interface TagInputFormItemConfig extends BaseFormItemConfig {
  type: 'tag-input'
  multiple?: boolean
  filterable?: boolean
  allowCreate?: boolean
  defaultFirstOption?: boolean
}

// 上传组件配置
export interface UploadFormItemConfig extends BaseFormItemConfig {
  type: 'upload'
  action?: string
  autoUpload?: boolean
  listType?: string
}

// 联合类型：表单项配置
export type FormItemConfig = 
  | BaseFormItemConfig
  | SlotFormItemConfig
  | CustomFormItemConfig
  | InputFormItemConfig
  | SelectFormItemConfig
  | NumberFormItemConfig
  | DateFormItemConfig
  | SliderFormItemConfig
  | RateFormItemConfig
  | CascaderFormItemConfig
  | TreeSelectFormItemConfig
  | AutocompleteFormItemConfig
  | TagInputFormItemConfig
  | UploadFormItemConfig

// 行配置
export interface RowConfig {
  bind?: Record<string, any>
  props?: Record<string, any>
  gutter?: number
  children: FormItemConfig[]
}

// 列配置
export interface ColumnConfig {
  name: string
  props?: Record<string, any>
  children: RowConfig[]
}

// 表单验证规则
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

// 组件Props
export interface FormTableProps {
  tableData: TableRow[]
  columns: ColumnConfig[]
  rules: Record<string, ValidationRule[]>
  formData: Record<string, any>
  loading?: boolean
  border?: boolean
  stripe?: boolean
  size?: 'medium' | 'small' | 'mini'
  showHeader?: boolean
  highlightCurrentRow?: boolean
  rowKey?: string
  defaultSort?: {
    prop: string
    order: 'ascending' | 'descending'
  }
  labelWidth?: string
  labelPosition?: 'left' | 'right' | 'top'
  customComponents?: CustomComponentConfig[]
  showRowActions?: boolean
  rowActions?: {
    add?: boolean
    remove?: boolean
    copy?: boolean
    moveUp?: boolean
    moveDown?: boolean
  }
  actionColumnWidth?: string
  actionColumnLabel?: string
}

// 组件事件
export interface FormTableEmits {
  'update:tableData': [data: TableRow[]]
  'update:formData': [data: Record<string, any>]
  'row-change': [row: TableRow, index: number]
  'row-add': [row: TableRow, index: number]
  'row-remove': [row: TableRow, index: number]
  'row-copy': [row: TableRow, index: number]
  'row-move': [row: TableRow, fromIndex: number, toIndex: number]
  'validate': [valid: boolean, errors: any[]]
  'cell-click': [row: TableRow, column: any, cell: any, event: Event]
  'cell-dblclick': [row: TableRow, column: any, cell: any, event: Event]
  'row-click': [row: TableRow, column: any, event: Event]
  'row-dblclick': [row: TableRow, column: any, event: Event]
}
