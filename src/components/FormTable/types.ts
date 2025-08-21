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

// 表单项配置
export interface FormItemConfig {
  key: string
  type: 'input' | 'select' | 'date' | 'datetime' | 'time' | 'textarea' | 'number' | 'switch' | 'radio' | 'checkbox' | 'text' | 'slotComponent' | 'custom' | 'rate' | 'slider' | 'color' | 'upload' | 'cascader' | 'tree-select' | 'autocomplete' | 'tag-input'
  slotName?: string
  customComponent?: string // 自定义组件名称
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
  min?: number
  max?: number
  step?: number
  showStops?: boolean
  showInput?: boolean
  range?: boolean
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
  size?: 'large' | 'default' | 'small'
  prefixIcon?: string
  suffixIcon?: string
  showWordLimit?: boolean
  maxlength?: number
  minlength?: number
  showPassword?: boolean
  autosize?: boolean | { minRows?: number; maxRows?: number }
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  autocomplete?: 'on' | 'off'
  name?: string
  id?: string
  tabindex?: string | number
  validateEvent?: boolean
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
