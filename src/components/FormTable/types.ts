export interface TableRow {
  [key: string]: any
}

export interface CustomComponentConfig {
  name: string
  component: any
}

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

// 常用字段直接声明，非常见配置通过 bind 透传给具体组件。
export interface FormItemConfig {
  key: string
  type: FormItemType
  colSpan?: number | string
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
  options?: Array<{ label: string; value: any; [key: string]: any }>
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
}

export interface RowConfig {
  bind?: Record<string, any>
  props?: Record<string, any>
  gutter?: number
  children: FormItemConfig[]
}

export interface ColumnConfig {
  name: string
  props?: Record<string, any>
  children: RowConfig[]
}

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

export interface FormTableEmits {
  'update:tableData': [data: TableRow[]]
  'update:formData': [data: Record<string, any>]
  'row-add': [row: TableRow, index: number]
  'row-remove': [row: TableRow, index: number]
  'validate': [valid: boolean, errors: any[]]
  'event': [payload: FormTableEventPayload]
}
