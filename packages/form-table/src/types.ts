import type { Component } from 'vue'

export type FormTableValue = any
export type FormTableRecord = Record<string, FormTableValue>
export type ComponentProps = Record<string, FormTableValue>

export interface TableRow extends FormTableRecord {}

export interface FormTableTableContext {
  /** 当前受控表格数据，只读以避免动态配置直接修改 props。 */
  tableData: ReadonlyArray<TableRow>
}

export interface FormTableColumnContext extends FormTableTableContext {
  /** 当前列配置。 */
  columnConfig: Readonly<ColumnConfig>
}

export interface FormTableRowContext extends FormTableColumnContext {
  /** 当前数据行。 */
  row: Readonly<TableRow>
  /** 当前数据行在 tableData 中的渲染下标。 */
  index: number
  /** 当前布局行配置。 */
  rowConfig: Readonly<RowConfig>
}

export interface FormTableFieldRenderContext extends FormTableRowContext {
  /** 支持点路径和数组下标的字段路径。 */
  fieldKey: string
  /** 按 fieldKey 从当前行读取的字段值。 */
  value: FormTableValue
  /** 当前字段配置。 */
  itemConfig: Readonly<FormItemConfig>
}

export interface FormTableFieldContext extends FormTableFieldRenderContext {
  /** 不可变地更新当前字段。 */
  setValue: (value: FormTableValue) => void
  /** 不可变地批量更新当前行，patch 的 key 支持字段路径。 */
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
  /** 组件内部更新入口；通过行身份重新定位，不依赖可能过期的渲染下标。 */
  setValue: (row: TableRow, fieldKey: string, value: FormTableValue) => void
  updateRow: (row: TableRow, patch: Partial<TableRow>) => void
}

/** 以下注入键仅用于 FormTable 内部组件通信。 */
export const FORM_TABLE_CONTEXT_KEY: unique symbol = Symbol('formTableContext')
export const FORM_TABLE_UPDATE_KEY: unique symbol = Symbol('formTableUpdate')
export const FORM_TABLE_SLOTS_KEY: unique symbol = Symbol('formTableSlots')
