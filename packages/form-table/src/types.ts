import type { Component } from 'vue'

export type FormTableValue = any
export type FormTableRecord = Record<string, FormTableValue>
export type ComponentProps = Record<string, FormTableValue>

export interface TableRow extends FormTableRecord {}

export interface FormTableTableContext {
  tableData: ReadonlyArray<TableRow>
}

export interface FormTableRowContext extends FormTableTableContext {
  row: Readonly<TableRow>
  index: number
}

export interface FormTableFieldRenderContext extends FormTableRowContext {
  fieldKey: string
}

export interface FormTableFieldContext extends FormTableFieldRenderContext {
  value: FormTableValue
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
 * `is` 直接接收自定义组件；未提供时由字段 `type` 映射 Element UI 组件。
 * 其余配置只描述实际字段组件，不承载布局、校验或业务行为。
 */
export interface FieldComponentConfig {
  is?: string | Component
  props?: DynamicValue<ComponentProps, FormTableFieldRenderContext>
  listeners?: Record<string, FormTableFieldListener>
  options?: DynamicValue<FormItemOption[], FormTableFieldRenderContext>
  optionProps?: DynamicValue<OptionPropsConfig, FormTableFieldRenderContext>
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
  | 'rate'
  | 'slider'
  | 'color'
  | 'upload'
  | 'cascader'
  | 'tree-select'
  | 'autocomplete'
  | 'tag-input'

interface BaseFormItemConfig {
  /** 行数据字段路径，例如 `name`、`profile.city`。 */
  fieldKey: string
  visible?: DynamicValue<boolean, FormTableFieldRenderContext>
  /** 直接传给 el-col。 */
  colProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext>
  /** 直接传给 el-form-item。 */
  formItemProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext>
}

export interface TypeFormItemConfig extends BaseFormItemConfig {
  type: FormItemType
  slot?: never
  component?: FieldComponentConfig & {
    is?: never
  }
}

export interface CustomComponentFormItemConfig extends BaseFormItemConfig {
  type?: never
  slot?: never
  component: FieldComponentConfig & {
    is: string | Component
  }
}

export interface SlotFormItemConfig extends BaseFormItemConfig {
  type?: never
  slot: string
  component?: never
}

export type FormItemConfig =
  | TypeFormItemConfig
  | CustomComponentFormItemConfig
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
  visible?: DynamicValue<boolean, FormTableTableContext>
  /** 直接传给 el-table-column。 */
  props?: DynamicValue<ComponentProps, FormTableTableContext>
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

export interface FormTableSlotContext extends FormTableFieldContext {
  propPath: string
}

export interface FormTableHeaderSlotContext extends FormTableTableContext {
  column: ColumnConfig
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
