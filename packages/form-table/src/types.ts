import type { Component } from 'vue'

export type FormTableValue = any
export type FormTableRecord = Record<string, FormTableValue>
export type ComponentProps = Record<string, FormTableValue>

export interface TableRow extends FormTableRecord {}

export interface FormTableTableContext {
  tableData: ReadonlyArray<TableRow>
}

export interface FormTableColumnContext extends FormTableTableContext {
  columnConfig: Readonly<ColumnConfig>
}

export interface FormTableRowContext extends FormTableColumnContext {
  row: Readonly<TableRow>
  index: number
  rowConfig: Readonly<RowConfig>
}

export interface FormTableFieldRenderContext extends FormTableRowContext {
  fieldKey: string
  value: FormTableValue
  itemConfig: Readonly<FormItemConfig>
}

export interface FormTableFieldContext extends FormTableFieldRenderContext {
  setValue: (value: FormTableValue) => void
  updateRow: (patch: Partial<TableRow>) => void
}

export type DynamicValue<T, Context> = T | ((context: Context) => T)
export type FormTableFieldListener = (
  context: FormTableFieldContext,
  ...args: unknown[]
) => void

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

/**
 * 字段组件配置。
 *
 * `renderer` 在 component 模式下接收组件，在 slot 模式下接收具名 slot 名称。
 * 其余配置只描述实际字段组件，不承载布局、校验或业务行为。
 */
export interface FieldComponentConfig {
  renderer?: string | Component
  props?: DynamicValue<ComponentProps, FormTableFieldRenderContext>
  listeners?: Record<string, FormTableFieldListener>
  options?: DynamicValue<FormItemOption[], FormTableFieldRenderContext>
  optionProps?: DynamicValue<OptionPropsConfig, FormTableFieldRenderContext>
}

export type BuiltinFormItemType =
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
  | 'rate'
  | 'slider'
  | 'color'
  | 'upload'
  | 'cascader'
  | 'tree-select'
  | 'autocomplete'
  | 'tag-input'

export type FormItemType = BuiltinFormItemType | 'component' | 'slot'

interface BaseFormItemConfig {
  /** 字段渲染身份；动态增删、排序或重复 fieldKey 时建议提供。 */
  key?: string
  /** 行数据字段路径，例如 `name`、`profile.city`。 */
  fieldKey: string
  visible?: DynamicValue<boolean, FormTableFieldRenderContext>
  /** 直接传给 el-col。 */
  colProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext>
  /** 直接传给 el-form-item。 */
  formItemProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext>
}

export interface BuiltinFormItemConfig extends BaseFormItemConfig {
  type: BuiltinFormItemType
  component?: FieldComponentConfig & {
    renderer?: never
  }
}

export interface ComponentFormItemConfig extends BaseFormItemConfig {
  type: 'component'
  component: FieldComponentConfig & {
    renderer: string | Component
  }
}

export interface SlotFormItemConfig extends BaseFormItemConfig {
  type: 'slot'
  component: FieldComponentConfig & {
    renderer: string
  }
}

export type FormItemConfig =
  | BuiltinFormItemConfig
  | ComponentFormItemConfig
  | SlotFormItemConfig

export interface RowConfig {
  key?: string
  visible?: DynamicValue<boolean, FormTableRowContext>
  /** 直接传给 el-row。 */
  props?: DynamicValue<ComponentProps, FormTableRowContext>
  children: FormItemConfig[]
}

export interface ColumnConfig {
  key?: string
  /** el-table-column 的表头文本。 */
  label: string
  headerSlot?: string
  visible?: DynamicValue<boolean, FormTableColumnContext>
  /** 直接传给 el-table-column。 */
  props?: DynamicValue<ComponentProps, FormTableColumnContext>
  children: RowConfig[]
}

export interface FormTableProps {
  tableData: TableRow[]
  columns: ColumnConfig[]
  formProps?: ComponentProps
  tableProps?: ComponentProps
  loading?: boolean
}

export interface FormTableFieldChangePayload {
  row: TableRow
  index: number
  fieldKey: string
  value: FormTableValue
  previousValue: FormTableValue
}

export interface ResolvedComponentConfig {
  renderer?: string | Component
  props: ComponentProps
  listeners: Record<string, (...args: unknown[]) => void>
  options: FormItemOption[]
  optionProps?: OptionPropsConfig
}

export interface FormTableSlotContext extends FormTableFieldContext {
  propPath: string
  component: ResolvedComponentConfig
}

export interface FormTableHeaderSlotContext extends FormTableColumnContext {
  columnIndex: number
  label: string
}

export type FormTableSlotFn<T = FormTableValue> = (slotProps: T) => FormTableValue
export type FormTableSlots = Record<string, FormTableSlotFn | undefined>

export interface FormTableElementFormRef {
  validate?: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean> | boolean
  validateField?: (fieldProp: string, callback?: (message: string) => void) => void
  resetFields?: () => void
  clearValidate?: (fieldProps?: string | string[]) => void
}

export interface FormTableElementTableRef {
  [key: string]: FormTableValue
}

export interface FormTableExpose {
  validate: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean>
  resetFields: () => void
  clearValidate: (fieldProps?: string | string[]) => void
  getFormRef: () => FormTableElementFormRef | null
  getTableRef: () => FormTableElementTableRef | null
}

export interface FormTableUpdateApi {
  setValue: (rowIndex: number, fieldKey: string, value: FormTableValue) => void
  updateRow: (rowIndex: number, patch: Partial<TableRow>) => void
}

export const FORM_TABLE_CONTEXT_KEY: unique symbol = Symbol('formTableContext')
export const FORM_TABLE_UPDATE_KEY: unique symbol = Symbol('formTableUpdate')
export const FORM_TABLE_SLOTS_KEY: unique symbol = Symbol('formTableSlots')
