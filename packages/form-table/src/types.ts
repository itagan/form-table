import type { Component, Ref } from 'vue'

/** 表格字段允许承载的任意业务值。 */
export type FormTableValue = any
/** FormTable 使用的通用键值对象。 */
export type FormTableRecord = Record<string, FormTableValue>
/** 透传给 Vue/Element UI 组件的属性集合。 */
export type ComponentProps = Record<string, FormTableValue>

/** FormTable 自身管理 rowKey，Table 透传属性不再接受同名配置。 */
export type FormTableTableProps = ComponentProps & { rowKey?: never }

/** 单条表格行数据。 */
export interface TableRow extends FormTableRecord {}

export interface FormTableTableContext<TRow extends TableRow = TableRow> {
  /** 当前受控表格数据，只读以避免动态配置直接修改 props。 */
  tableData: ReadonlyArray<TRow>
}

export interface FormTableColumnContext<TRow extends TableRow = TableRow> extends FormTableTableContext<TRow> {
  /** 当前列配置。 */
  columnConfig: Readonly<ColumnConfig<TRow>>
}

export interface FormTableRowContext<TRow extends TableRow = TableRow> extends FormTableColumnContext<TRow> {
  /** 当前数据行。 */
  row: Readonly<TRow>
  /** 当前数据行在 tableData 中的渲染下标。 */
  index: number
  /** 当前布局行配置。 */
  rowConfig: Readonly<RowConfig<TRow>>
}

export interface FormTableFieldRenderContext<TRow extends TableRow = TableRow> extends FormTableRowContext<TRow> {
  /** 支持点路径和数组下标的字段路径。 */
  fieldKey: string
  /** 按 fieldKey 从当前行读取的字段值。 */
  value: FormTableValue
  /** 当前字段配置。 */
  itemConfig: Readonly<FormItemConfig<TRow>>
}

/** Hint 求值完成后提供给组件配置、监听器与 Slot 的字段上下文。 */
export interface FormTableResolvedFieldContext<TRow extends TableRow = TableRow> extends FormTableFieldRenderContext<TRow> {
  /** 当前字段已经标准化的 Hint；Hint 自身求值时不包含此属性。 */
  hint: ResolvedFormTableHint | null
}

export interface FormTableFieldContext<TRow extends TableRow = TableRow> extends FormTableResolvedFieldContext<TRow> {
  /** 不可变地更新当前字段。 */
  setValue: (value: FormTableValue) => void
  /** 不可变地批量更新当前行，patch 的 key 支持字段路径。 */
  updateRow: (patch: Partial<TRow>) => void
}

/** 支持直接值或根据运行时上下文计算的动态值。 */
export type DynamicValue<T, Context> = T | ((context: Context) => T)
/** 由 FormTable 或自定义渲染消费的提示配置。 */
export interface FormTableHintConfig {
  content: string
  /** auto 由 FormTable 处理展示与可访问性；custom 交给调用方。 */
  behavior?: 'auto' | 'custom'
}
/** FormTable 外层提示内容；字符串保持自动托管语义。 */
export type FormTableHint = string | FormTableHintConfig
/** 字段可用 false 关闭默认 Hint，或提供自己的提示内容。 */
export type FormTableFieldHint = false | FormTableHint
/** 动态 Hint 求值后提供给内部渲染与 Slot 的标准结构。 */
export interface ResolvedFormTableHint {
  content: string
  behavior: 'auto' | 'custom'
}
/** 整个 FormTable 统一采用的提示展示方式。 */
export type FormTableHintMode = 'title' | 'tooltip'
/** 根据基础字段上下文统一生成快捷 Hint 内容。 */
export type FormTableFieldHintFormatter<TRow extends TableRow = TableRow> = (
  context: FormTableFieldRenderContext<TRow>
) => string | null | undefined
/** 未显式提供内容的字段所继承的默认 Hint。 */
export type FormTableDefaultFieldHint<TRow extends TableRow = TableRow> =
  | boolean
  | FormTableFieldHintFormatter<TRow>
/** FormTable 统一提示策略；Tooltip 属性仅在对应模式下有效。 */
export type FormTableHintOptions<TRow extends TableRow = TableRow> = {
  /** false/未配置关闭；true 默认字符串化；函数统一格式化；不影响 headerHint。 */
  field?: FormTableDefaultFieldHint<TRow>
} & (
  | {
      mode?: 'title'
    }
  | {
      mode: 'tooltip'
      props?: ComponentProps
    }
)
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
  /** 接收当前字段值的组件 prop，默认 value。 */
  prop?: string
  /** 通知字段值变化的组件事件，默认 input。 */
  event?: string
  /** 从组件事件参数中提取需要写回表格的字段值。 */
  valueFromEvent?: (...args: unknown[]) => FormTableValue
}

/** 根据当前字段所在行同步选择实际渲染组件。 */
export type FieldRendererResolver<TRow extends TableRow = TableRow> = (
  context: FormTableResolvedFieldContext<TRow>
) => string | Component | undefined

/**
 * 字段组件配置。
 *
 * `renderer` 在 component 模式下接收组件，在 slot 模式下接收具名 slot 名称；
 * component 模式还可通过 `resolveRenderer` 按当前行选择实际组件。
 * 其余配置只描述实际字段组件，不承载布局、校验或业务行为。
 */
export interface FieldComponentConfig<TRow extends TableRow = TableRow> {
  /** component 模式为组件；slot 模式为具名插槽名称。 */
  renderer?: string | Component
  /** component 模式按字段上下文同步选择组件；返回 undefined 时回退到 renderer。 */
  resolveRenderer?: FieldRendererResolver<TRow>
  /** 传给字段组件的属性。 */
  props?: DynamicValue<ComponentProps, FormTableResolvedFieldContext<TRow>>
  /** 字段组件事件及其业务处理器。 */
  listeners?: Record<string, FormTableFieldListener<TRow>>
  /** 选项型组件使用的数据源。 */
  options?: DynamicValue<FormItemOption[], FormTableResolvedFieldContext<TRow>>
  /** 自定义选项字段映射。 */
  optionProps?: DynamicValue<OptionPropsConfig, FormTableResolvedFieldContext<TRow>>
  /** true/未配置使用组件原生 v-model；对象自定义协议；false 完全关闭绑定。 */
  model?: FieldModelConfig | boolean
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
  | 'autocomplete'

/** 字段支持的全部渲染模式。 */
export type FormItemType = BuiltinFormItemType | 'component' | 'slot'

/** 所有字段配置共享的身份、数据路径、显隐、布局和校验属性。 */
interface BaseFormItemConfig<TRow extends TableRow = TableRow> {
  /** 字段渲染身份；动态增删、排序或重复 fieldKey 时建议提供。 */
  key?: string
  /** 行数据字段路径，例如 `name`、`profile.city`。 */
  fieldKey: string
  visible?: DynamicValue<boolean, FormTableFieldRenderContext<TRow>>
  /** 直接传给 el-col。 */
  colProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  /** 直接传给 el-form-item。 */
  formItemProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  /** 字段提示；behavior=auto 按表级 hintOptions 应用，custom 时由调用方处理。 */
  hint?: DynamicValue<FormTableFieldHint | null | undefined, FormTableFieldRenderContext<TRow>>
}

/** 使用内置 type 映射渲染的字段配置。 */
export interface BuiltinFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: BuiltinFormItemType
  component?: FieldComponentConfig<TRow> & {
    renderer?: never
    resolveRenderer?: never
  }
}

/** component 模式必须提供静态 renderer 或动态 resolveRenderer。 */
type ComponentRendererConfig<TRow extends TableRow = TableRow> =
  | {
      renderer: string | Component
      resolveRenderer?: FieldRendererResolver<TRow>
    }
  | {
      renderer?: never
      resolveRenderer: FieldRendererResolver<TRow>
    }

/** 使用调用方提供的 Vue 组件渲染的字段配置。 */
export interface ComponentFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: 'component'
  component: FieldComponentConfig<TRow> & ComponentRendererConfig<TRow>
}

/** 使用父组件具名插槽渲染的字段配置。 */
export interface SlotFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: 'slot'
  component: FieldComponentConfig<TRow> & {
    renderer: string
    resolveRenderer?: never
  }
}

/** 通过可辨识联合约束不同渲染模式的 renderer 配置。 */
export type FormItemConfig<TRow extends TableRow = TableRow> =
  | BuiltinFormItemConfig<TRow>
  | ComponentFormItemConfig<TRow>
  | SlotFormItemConfig<TRow>

/** 单个 el-row 布局配置，可包含多个字段。 */
export interface RowConfig<TRow extends TableRow = TableRow> {
  /** 布局行的稳定渲染身份。 */
  key?: string
  /** 静态或动态显隐配置。 */
  visible?: DynamicValue<boolean, FormTableRowContext<TRow>>
  /** 直接传给 el-row。 */
  props?: DynamicValue<ComponentProps, FormTableRowContext<TRow>>
  /** 当前布局行包含的字段配置。 */
  children: FormItemConfig<TRow>[]
}

/** 所有 el-table-column 共用的表头、显隐和透传配置。 */
interface BaseColumnConfig<TRow extends TableRow = TableRow> {
  /** 列的稳定渲染身份；动态增删、显隐或替换配置时应保持唯一。 */
  key?: string
  /** el-table-column 的表头文本。 */
  label: string
  /** 自定义表头使用的父组件具名插槽。 */
  headerSlot?: string
  /** 传给默认或 Slot 表头包装节点；可配置原生 title、class、style 和 aria 属性。 */
  headerProps?: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
  /** 表头提示；behavior=auto 按表级 hintOptions 应用，custom 时由调用方处理。 */
  headerHint?: DynamicValue<FormTableHint | null | undefined, FormTableColumnContext<TRow>>
  /** 静态或动态显隐配置。 */
  visible?: DynamicValue<boolean, FormTableColumnContext<TRow>>
  /** 直接传给 el-table-column。 */
  props?: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
}

/** 通过 Row/Item 布局渲染表单字段的列。 */
export interface LayoutColumnConfig<TRow extends TableRow = TableRow> extends BaseColumnConfig<TRow> {
  /** 当前列内的布局行配置。 */
  children: RowConfig<TRow>[]
  cellSlot?: never
}

/** 纯 Element Table Column 透传列；不进入 FormTable 单元格渲染链路。 */
export interface PlainColumnConfig<TRow extends TableRow = TableRow> {
  /** 列的稳定渲染身份。 */
  key?: string
  /** 原生功能列通常可省略标题。 */
  label?: string
  /** 静态或动态显隐配置。 */
  visible?: DynamicValue<boolean, FormTableColumnContext<TRow>>
  /** 直接传给 el-table-column；必填以明确选择纯透传列模式。 */
  props: DynamicValue<ComponentProps, FormTableColumnContext<TRow>>
  children?: never
  cellSlot?: never
  headerSlot?: never
  headerProps?: never
  headerHint?: never
}

/** 直接使用父组件具名 Slot 渲染单元格的列。 */
export interface CellSlotColumnConfig<TRow extends TableRow = TableRow> extends BaseColumnConfig<TRow> {
  /** 单元格 scoped slot 名称；不创建 Row/Item 或表单字段上下文。 */
  cellSlot: string
  children?: never
}

/** 列级单元格 Slot 可使用的精简上下文。 */
export interface FormTableCellSlotContext<TRow extends TableRow = TableRow> {
  /** 当前业务数据行。 */
  row: Readonly<TRow>
  /** 当前数据行在 tableData 中的渲染下标。 */
  index: number
  /** 当前 cellSlot 列配置。 */
  columnConfig: Readonly<CellSlotColumnConfig<TRow>>
  /** 不可变地批量更新当前行，patch 的 key 支持字段路径。 */
  updateRow: (patch: Partial<TRow>) => void
}

/** 布局列、列级 Slot 和纯 Element Column 是三条互斥渲染路径。 */
export type ColumnConfig<TRow extends TableRow = TableRow> =
  | LayoutColumnConfig<TRow>
  | CellSlotColumnConfig<TRow>
  | PlainColumnConfig<TRow>

/** FormTable 与 Element Table 共用的稳定行身份配置。 */
export type FormTableRowKey<TRow extends TableRow = TableRow> =
  | string
  | ((row: TRow) => FormTableValue)

/** FormTable 组件的公开 props 类型。 */
export interface FormTableProps<TRow extends TableRow = TableRow> {
  /** 根组件 Vue 2 v-model 对应 prop，通过 update:tableData 回写。 */
  tableData: TRow[]
  columns: ColumnConfig<TRow>[]
  rowKey?: FormTableRowKey<TRow>
  formProps?: ComponentProps
  tableProps?: FormTableTableProps
  /** headerHint/hint 的表级统一展示策略，默认使用原生 title。 */
  hintOptions?: FormTableHintOptions<TRow>
  loading?: boolean
}

/** field-change 事件载荷，包含新旧值和更新后的行。 */
export interface FormTableFieldChangePayload<TRow extends TableRow = TableRow> {
  row: TRow
  index: number
  fieldKey: string
  value: FormTableValue
  previousValue: FormTableValue
}

/** 动态配置求值后交给渲染层和插槽使用的组件配置。 */
export interface ResolvedComponentConfig {
  renderer?: string | Component
  props: ComponentProps
  listeners: Record<string, (...args: unknown[]) => void>
  options: FormItemOption[]
  optionProps?: OptionPropsConfig
  model?: FieldModelConfig | boolean
}

/** 动态配置求值后交给默认表头和表头插槽使用的展示配置。 */
export interface ResolvedHeaderConfig {
  props: ComponentProps
  hint: ResolvedFormTableHint | null
}

/** 字段插槽可使用的完整上下文。 */
export interface FormTableSlotContext<TRow extends TableRow = TableRow> extends FormTableFieldContext<TRow> {
  propPath: string
  component: ResolvedComponentConfig
}

/** 自定义表头插槽可使用的列上下文。 */
export interface FormTableHeaderSlotContext<TRow extends TableRow = TableRow> extends FormTableColumnContext<TRow> {
  columnIndex: number
  label: string
  /** 已解析的表头属性与提示；表头 Slot 可自行决定如何使用。 */
  header: ResolvedHeaderConfig
}

/** Vue 2 scoped slot 的统一函数签名。 */
export type FormTableSlotFn<T = FormTableValue> = (slotProps: T) => FormTableValue
/** 以插槽名称索引的父组件插槽集合。 */
export type FormTableSlots = Record<string, FormTableSlotFn | undefined>

/** 组件对 Element UI el-form 实例能力的最小依赖。 */
export interface FormTableElementFormRef {
  validate?: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean> | boolean
  validateField?: (fieldProp: string, callback?: (message: string) => void) => void
  resetFields?: () => void
  clearValidate?: (fieldProps?: string | string[]) => void
}

/** Element UI el-table 实例引用；具体能力由使用方按版本读取。 */
export interface FormTableElementTableRef {
  [key: string]: FormTableValue
}

/** 通过组件 ref 对外暴露的稳定方法。 */
export interface FormTableExpose {
  validate: (callback?: (valid: boolean, fields?: FormTableValue) => void) => Promise<boolean>
  clearValidate: (fieldProps?: string | string[]) => void
  getFormRef: () => FormTableElementFormRef | null
  getTableRef: () => FormTableElementTableRef | null
}

export interface FormTableUpdateApi<TRow extends TableRow = TableRow> {
  /** 组件内部更新入口；通过行身份重新定位，不依赖可能过期的渲染下标。 */
  setValue: (row: TRow, fieldKey: string, value: FormTableValue) => void
  updateRow: (row: TRow, patch: Partial<TRow>) => void
}

/** 以下注入键仅用于 FormTable 内部组件通信。 */
export const FORM_TABLE_CONTEXT_KEY: unique symbol = Symbol('formTableContext')
export const FORM_TABLE_UPDATE_KEY: unique symbol = Symbol('formTableUpdate')
export const FORM_TABLE_SLOTS_KEY: unique symbol = Symbol('formTableSlots')
export const FORM_TABLE_HINT_MODE_KEY: unique symbol = Symbol('formTableHintMode')
export const FORM_TABLE_DEFAULT_FIELD_HINT_KEY: unique symbol = Symbol('formTableDefaultFieldHint')

/** 响应式提示模式仅供 FormTable 内部渲染链使用。 */
export type FormTableHintModeContext = Readonly<Ref<FormTableHintMode>>
/** 响应式字段默认 Hint，仅供 FormTable 内部字段链使用。 */
export type FormTableDefaultFieldHintContext<TRow extends TableRow = TableRow> = Readonly<
Ref<FormTableDefaultFieldHint<TRow> | undefined>
>
