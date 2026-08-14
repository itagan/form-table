import type { Component } from 'vue'
import type {
  ComponentProps,
  DynamicValue,
  FormTableHintValue,
  FormTableTableProps,
  FormTableValue,
  TableRow
} from './base'
import type {
  FormTableColumnContext,
  FormTableFieldContext,
  FormTableFieldRenderContext,
  FormTableRowContext
} from './context'

/** 根据基础字段上下文统一生成快捷 Hint 内容。 */
export type FormTableFieldHintFormatter<TRow extends TableRow = TableRow> = (
  context: FormTableFieldRenderContext<TRow>
) => FormTableHintValue
/** 未显式提供内容的字段所继承的默认 Hint。 */
export type FormTableDefaultFieldHint<TRow extends TableRow = TableRow> =
  | boolean
  | FormTableFieldHintFormatter<TRow>
/** FormTable 自动提示策略；Tooltip 属性仅在对应模式下有效。 */
export interface FormTableHintOptions<TRow extends TableRow = TableRow> {
  mode?: false | 'title' | 'tooltip'
  targets?: 'field' | 'header' | 'all'
  /** false/未配置关闭默认字段内容；true 默认字符串化；函数统一格式化。 */
  field?: FormTableDefaultFieldHint<TRow>
  tooltipProps?: ComponentProps
}
/** 字段组件事件监听器签名，第一个参数固定为字段上下文。 */
export type FormTableFieldListener<TRow extends TableRow = TableRow> = (
  context: FormTableFieldContext<TRow>,
  ...args: unknown[]
) => void

/** select、radio、checkbox 等选项型组件的单个选项。 */
export interface FormItemOption {
  label?: FormTableValue
  value?: FormTableValue
  disabled?: boolean
  [key: string]: FormTableValue
}

/** 将自定义选项对象字段映射到组件所需的标准语义。 */
export interface OptionPropsConfig {
  label?: string
  value?: string
  disabled?: string
  key?: string
}

/** 自定义字段组件的受控值协议；未配置时使用组件原生 Vue 2 v-model。 */
export interface FieldModelConfig {
  prop?: string
  event?: string
  valueFromEvent?: (...args: unknown[]) => FormTableValue
}

/** 根据当前字段所在行同步选择实际渲染组件。 */
export type FieldRendererResolver<TRow extends TableRow = TableRow> = (
  context: FormTableFieldRenderContext<TRow>
) => string | Component | undefined

export interface FieldComponentConfig<TRow extends TableRow = TableRow> {
  renderer?: string | Component
  resolveRenderer?: FieldRendererResolver<TRow>
  props?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  listeners?: Record<string, FormTableFieldListener<TRow>>
  options?: DynamicValue<FormItemOption[], FormTableFieldRenderContext<TRow>>
  optionProps?: DynamicValue<OptionPropsConfig, FormTableFieldRenderContext<TRow>>
  model?: FieldModelConfig | false
}

export type BuiltinFormItemType =
  | 'input' | 'select' | 'date' | 'datetime' | 'time' | 'textarea'
  | 'number' | 'switch' | 'radio' | 'checkbox' | 'text' | 'rate'
  | 'slider' | 'color' | 'cascader' | 'autocomplete'

export type FormItemType = BuiltinFormItemType | 'component' | 'slot'

interface BaseFormItemConfig<TRow extends TableRow = TableRow> {
  key?: string
  fieldKey: string
  visible?: DynamicValue<boolean, FormTableFieldRenderContext<TRow>>
  colProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  formItemProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  hint?: DynamicValue<FormTableHintValue, FormTableFieldRenderContext<TRow>>
}

export interface BuiltinFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: BuiltinFormItemType
  component?: FieldComponentConfig<TRow> & { renderer?: never, resolveRenderer?: never }
}

type ComponentRendererConfig<TRow extends TableRow = TableRow> =
  | { renderer: string | Component, resolveRenderer?: FieldRendererResolver<TRow> }
  | { renderer?: never, resolveRenderer: FieldRendererResolver<TRow> }

export interface ComponentFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: 'component'
  component: FieldComponentConfig<TRow> & ComponentRendererConfig<TRow>
}

export interface SlotFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: 'slot'
  component: FieldComponentConfig<TRow> & { renderer: string, resolveRenderer?: never }
}

export type FormItemConfig<TRow extends TableRow = TableRow> =
  | BuiltinFormItemConfig<TRow>
  | ComponentFormItemConfig<TRow>
  | SlotFormItemConfig<TRow>

interface BaseColumnConfig<TRow extends TableRow = TableRow> {
  key?: string
  label: string
  headerSlot?: string
  headerProps?: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
  headerHint?: DynamicValue<FormTableHintValue, FormTableColumnContext<TRow>>
  visible?: DynamicValue<boolean, FormTableColumnContext<TRow>>
  props?: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
}

export interface LayoutColumnConfig<TRow extends TableRow = TableRow> extends BaseColumnConfig<TRow> {
  rowProps?: DynamicValue<ComponentProps, FormTableRowContext<TRow>>
  children: FormItemConfig<TRow>[]
  cellSlot?: never
}

export interface NativeColumnConfig<TRow extends TableRow = TableRow> {
  key?: string
  label?: string
  visible?: DynamicValue<boolean, FormTableColumnContext<TRow>>
  props: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
  children?: never
  cellSlot?: never
  headerSlot?: never
  headerProps?: never
  headerHint?: never
  rowProps?: never
}

export interface CellSlotColumnConfig<TRow extends TableRow = TableRow> extends BaseColumnConfig<TRow> {
  cellSlot: string
  children?: never
  rowProps?: never
}

export interface FormTableCellSlotContext<TRow extends TableRow = TableRow> {
  row: Readonly<TRow>
  index: number
  columnConfig: Readonly<CellSlotColumnConfig<TRow>>
  updateRow: (patch: Partial<TRow>) => void
}

export type ColumnConfig<TRow extends TableRow = TableRow> =
  | LayoutColumnConfig<TRow>
  | CellSlotColumnConfig<TRow>
  | NativeColumnConfig<TRow>

export type FormTableRowKey<TRow extends TableRow = TableRow> =
  | string
  | ((row: TRow) => FormTableValue)

export interface FormTableProps<TRow extends TableRow = TableRow> {
  tableData: TRow[]
  columns: ColumnConfig<TRow>[]
  rowKey?: FormTableRowKey<TRow>
  formProps?: ComponentProps
  tableProps?: FormTableTableProps
  hintOptions?: FormTableHintOptions<TRow>
  loading?: boolean
}

export interface FormTableFieldChangePayload<TRow extends TableRow = TableRow> {
  row: TRow
  index: number
  fieldKey: string
  value: FormTableValue
  previousValue: FormTableValue
}

/** Element Table 事件中的运行时列对象；保留扩展字段以兼容不同 Element UI 版本。 */
export interface FormTableElementColumn {
  id?: string
  columnKey?: string
  label?: string
  property?: string
  prop?: string
  type?: string
  [key: string]: FormTableValue
}

/** Element Table sort-change 的原始载荷。 */
export interface FormTableSortChangePayload {
  column: FormTableElementColumn
  prop: string | null
  order: 'ascending' | 'descending' | null
}

/** Element Table filter-change 按 column-key 返回的筛选值。 */
export type FormTableFilterChangePayload = Record<string, FormTableValue[]>

export type FormTableEmits<TRow extends TableRow = TableRow> = {
  'update:tableData': (data: TRow[]) => void
  'field-change': (payload: FormTableFieldChangePayload<TRow>) => void
  'sort-change': (payload: FormTableSortChangePayload) => void
  'filter-change': (filters: FormTableFilterChangePayload) => void
  'header-click': (column: FormTableElementColumn, event: MouseEvent) => void
  'header-contextmenu': (column: FormTableElementColumn, event: MouseEvent) => void
  'header-dragend': (
    newWidth: number,
    oldWidth: number,
    column: FormTableElementColumn,
    event: MouseEvent
  ) => void
  'cell-click': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'cell-dblclick': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'cell-contextmenu': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'cell-mouse-enter': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  'cell-mouse-leave': (
    row: TRow,
    column: FormTableElementColumn,
    cell: HTMLTableCellElement,
    event: MouseEvent
  ) => void
  select: (selection: TRow[], row: TRow) => void
  'select-all': (selection: TRow[]) => void
  'selection-change': (selection: TRow[]) => void
}
