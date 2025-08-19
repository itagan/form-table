// 表格行数据类型
export interface TableRow {
  [key: string]: any
}

// 表单项配置
export interface FormItemConfig {
  key: string
  type: 'input' | 'select' | 'date' | 'datetime' | 'time' | 'textarea' | 'number' | 'switch' | 'radio' | 'checkbox' | 'text' | 'slotComponent'
  slotName?: string
  colSpan?: number | string
  bind?: Record<string, any>
  isUseTooltip?: boolean
  rules?: any[]
  label?: string
  labelWidth?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  min?: number
  max?: number
  [key: string]: any
}

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
}

// 组件事件
export interface FormTableEmits {
  'update:tableData': [data: TableRow[]]
  'update:formData': [data: Record<string, any>]
  'row-change': [row: TableRow, index: number]
  'row-add': [row: TableRow, index: number]
  'row-remove': [row: TableRow, index: number]
  'validate': [valid: boolean, errors: any[]]
}
