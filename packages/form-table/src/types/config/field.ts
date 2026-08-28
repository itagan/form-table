import type { Component } from 'vue'
import type {
  ComponentProps,
  DynamicValue,
  FormTableFormItemProps,
  FormTableHintTrigger,
  FormTableHintValue,
  FormTableRecord,
  FormTableValue,
  TableRow
} from '../base'
import type {
  FormTableFieldContext,
  FormTableFieldRenderContext
} from '../context'

/** 字段组件事件监听器签名，第一个参数固定为字段上下文。 */
export type FormTableFieldListener<TRow extends TableRow = TableRow> = (
  context: FormTableFieldContext<TRow>,
  ...args: unknown[]
) => void

/** select、radio、checkbox 等选项型组件的单个选项。 */
export interface FormItemOption {
  /** 默认展示文本；可通过 optionProps.label 映射其他字段。 */
  label?: FormTableValue
  /** 默认受控值；可通过 optionProps.value 映射其他字段。 */
  value?: FormTableValue
  /** 是否禁用当前选项；可通过 optionProps.disabled 映射其他字段。 */
  disabled?: boolean
  [key: string]: FormTableValue
}

/** 将自定义选项对象字段映射到组件所需的标准语义。 */
export interface OptionPropsConfig {
  /** 业务选项对象中作为展示文本的字段名。 */
  label?: string
  /** 业务选项对象中作为受控值的字段名。 */
  value?: string
  /** 业务选项对象中作为禁用状态的字段名。 */
  disabled?: string
  /** 业务选项对象中作为渲染 key 的字段名。 */
  key?: string
}

interface BaseFieldModelConfig<TRow extends TableRow> {
  prop?: string
  /** 将行字段或 binding.map 组合值同步转换为组件 model prop。 */
  valueToProp?: (
    context: FormTableFieldRenderContext<TRow>,
    bindingValue: FormTableValue
  ) => FormTableValue
}

/** 严格事件回调仍可存入运行时使用的宽松字段注册表。 */
type FieldModelValueFromEvent<
  TRow extends TableRow,
  TArgs extends unknown[]
> = {
  bivarianceHack(
    context: FormTableFieldRenderContext<TRow>,
    ...args: TArgs
  ): FormTableValue
}['bivarianceHack']

/** 自定义字段 type 可选的事件名到原始参数元组协议。 */
export type FieldTypeEventMap = Record<string, unknown[]>

type FieldModelForEvent<
  TRow extends TableRow,
  TEvents extends Record<keyof TEvents, unknown[]>,
  TEvent extends Extract<keyof TEvents, string>
> = BaseFieldModelConfig<TRow> & {
  event: TEvent
  /** 从只读字段上下文和当前 model 事件参数同步生成新的绑定值。 */
  valueFromEvent?: FieldModelValueFromEvent<TRow, TEvents[TEvent]>
}

/**
 * 自定义字段组件的受控值协议；未配置时使用组件原生 Vue 2 v-model。
 * 显式传入事件表时，event 与 valueFromEvent 参数元组保持关联。
 */
export type FieldModelConfig<
  TRow extends TableRow = TableRow,
  TEvents extends Record<keyof TEvents, unknown[]> = FieldTypeEventMap
> = string extends keyof TEvents
  ? BaseFieldModelConfig<TRow> & {
      event?: string
      valueFromEvent?: FieldModelValueFromEvent<TRow, unknown[]>
    }
  : {
      [TEvent in Extract<keyof TEvents, string>]: FieldModelForEvent<TRow, TEvents, TEvent>
    }[Extract<keyof TEvents, string>]

/** 只用于在结构类型中保留 Props/事件协议泛型，不产生运行时代码。 */
declare const FIELD_TYPE_PROTOCOL: unique symbol

export type FieldTypeListeners<
  TRow extends TableRow,
  TEvents extends Record<keyof TEvents, unknown[]>
> = {
  [TEvent in Extract<keyof TEvents, string>]?: (
    context: FormTableFieldContext<TRow>,
    ...args: TEvents[TEvent]
  ) => void
}

/** 使用方注册的轻量字段类型，只描述稳定组件目标、model 和默认属性。 */
export interface FieldTypeDefinition<
  TRow extends TableRow = TableRow,
  TProps extends object = ComponentProps,
  TEvents extends Record<keyof TEvents, unknown[]> = FieldTypeEventMap
> {
  is: string | Component
  model?: FieldModelConfig<TRow, TEvents> | false
  props?: DynamicValue<Partial<TProps>, FormTableFieldRenderContext<TRow>>
}

/** defineFormTableType 返回的协议化定义；品牌仅存在于类型系统。 */
export type TypedFieldTypeDefinition<
  TRow extends TableRow = TableRow,
  TProps extends object = ComponentProps,
  TEvents extends Record<keyof TEvents, unknown[]> = FieldTypeEventMap
> = FieldTypeDefinition<TRow, TProps, TEvents> & {
  readonly [FIELD_TYPE_PROTOCOL]: {
    props: TProps
    events: TEvents
    listeners: FieldTypeListeners<TRow, TEvents>
  }
}

/** 自定义字段类型名称到组件协议的实例级注册表。 */
export type FieldTypeRegistry<TRow extends TableRow = TableRow> = Record<
  string,
  FieldTypeDefinition<TRow, any, any>
>

/** 未声明自定义字段类型时使用的严格空注册表。 */
export type EmptyFieldTypeRegistry = Record<never, never>

/** 在行字段路径与组件受控值路径之间建立可序列化的双向映射。 */
export interface FieldBindingMapEntry {
  /** 当前行中需要读取和写回的字段路径。 */
  fieldPath: string
  /** 复合组件值中与 fieldPath 对应的字段路径。 */
  valuePath: string
  /** 组件值中无法解析 valuePath 时写入 fieldPath 的兜底值。 */
  fallbackValue?: FormTableValue
}

/** 一个字段渲染项所使用的复合值映射。 */
export interface FieldBindingConfig {
  /** 行字段路径与组件值路径的一对一映射；路径之间不可重复或重叠。 */
  map: FieldBindingMapEntry[]
}

/** 根据当前字段所在行同步选择实际渲染组件。 */
export type FieldComponentResolver<TRow extends TableRow = TableRow> = (
  context: FormTableFieldRenderContext<TRow>
) => string | Component | undefined

export interface FieldComponentConfig<TRow extends TableRow = TableRow> {
  /** 静态 Vue 组件或已注册的组件名称。 */
  is?: string | Component
  /** 根据当前字段上下文同步选择组件；返回 undefined 时回退到 is。 */
  resolveComponent?: FieldComponentResolver<TRow>
  /** slot 字段在根 FormTable 上对应的具名 Slot。 */
  slot?: string
  /** 透传给实际字段组件的属性。 */
  props?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  /** 字段组件事件监听器；回调首参固定为可更新的字段上下文。 */
  listeners?: Record<string, FormTableFieldListener<TRow>>
  /** select、radio、checkbox 等选项型组件的数据源。 */
  options?: DynamicValue<FormItemOption[], FormTableFieldRenderContext<TRow>>
  /** 将业务选项对象字段映射到 label、value、disabled 和 key。 */
  optionProps?: DynamicValue<OptionPropsConfig, FormTableFieldRenderContext<TRow>>
  /** 自定义受控值协议；undefined 使用组件原生 Vue 2 v-model，false 禁用写回。 */
  model?: FieldModelConfig<TRow> | false
}

export type BuiltinFormItemType =
  | 'input' | 'select' | 'date' | 'time' | 'time-select'
  | 'number' | 'switch' | 'radio' | 'checkbox' | 'text' | 'rate'
  | 'slider' | 'color' | 'cascader' | 'autocomplete'

export type FormItemType = BuiltinFormItemType | 'component' | 'slot'
export type ReservedFormItemType = FormItemType
export type RegisteredFormItemType<TFieldTypes> = Extract<keyof TFieldTypes, string>

/** 保留 FormTableRecord 的灵活值类型，同时排除把 meta 根节点配置为函数。 */
type StaticFormItemMeta = FormTableRecord & Record<string, unknown>

interface BaseFormItemConfig<TRow extends TableRow = TableRow> {
  /** 稳定字段标识；未提供时使用 fieldKey 参与内部身份计算。 */
  key?: string
  /** 当前字段在行数据中的路径，支持点路径和数组下标。 */
  fieldKey: string
  /** 将多个行字段组合为一个组件值，并在更新时反向拆分。 */
  binding?: FieldBindingConfig
  /** 使用方挂载的静态业务元数据；FormTable 不解析或消费。 */
  meta?: StaticFormItemMeta
  /** 根 FormTable 上用于渲染 FormItem label 的具名 Slot。 */
  labelSlot?: string
  /** 根 FormTable 上用于渲染 FormItem 校验错误的具名 Slot。 */
  errorSlot?: string
  /** 是否渲染当前字段，可按字段上下文动态计算。 */
  visible?: DynamicValue<boolean, FormTableFieldRenderContext<TRow>>
  /** 透传给字段外层 el-col 的属性。 */
  colProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  /** 透传给 el-form-item 的属性；prop 由 FormTable 自动管理。 */
  formItemProps?: DynamicValue<FormTableFormItemProps, FormTableFieldRenderContext<TRow>>
  /** 当前字段的 Hint 内容；false 可单独关闭该字段 Hint。 */
  hint?: DynamicValue<FormTableHintValue, FormTableFieldRenderContext<TRow>>
  /** item 使用整个 FormItem；content 使用其中唯一可见的内容根节点。 */
  hintTrigger?: FormTableHintTrigger
}

/** 使用内置字段类型渲染的配置。 */
export interface BuiltinFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  /** FormTable 内置字段类型。 */
  type: BuiltinFormItemType
  /** 字段组件的动态属性、监听器、选项与 model 覆盖。 */
  component?: FieldComponentConfig<TRow> & { is?: never, resolveComponent?: never, slot?: never }
}

type ComponentTargetConfig<TRow extends TableRow = TableRow> =
  | { is: string | Component, resolveComponent?: FieldComponentResolver<TRow>, slot?: never }
  | { is?: never, resolveComponent: FieldComponentResolver<TRow>, slot?: never }

type DirectFieldComponentConfig<TRow extends TableRow = TableRow> = Omit<
  FieldComponentConfig<TRow>,
  'options' | 'optionProps'
> & {
  options?: never
  optionProps?: never
}

/** 直接指定静态或动态 Vue 组件的字段配置。 */
export interface ComponentFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: 'component'
  /** 必须通过 is 或 resolveComponent 提供组件目标；选项数据作为实际组件 props 传入。 */
  component: DirectFieldComponentConfig<TRow> & ComponentTargetConfig<TRow>
}

/** 使用根 FormTable 具名 Slot 渲染内容的字段配置。 */
export interface SlotFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: 'slot'
  /** 必须通过 slot 指定具名 Slot，不创建实际字段组件。 */
  component: FieldComponentConfig<TRow> & { slot: string, is?: never, resolveComponent?: never }
}

type RegisteredFieldTypeProps<TDefinition> = TDefinition extends {
  readonly [FIELD_TYPE_PROTOCOL]: { props: object }
} ? TDefinition[typeof FIELD_TYPE_PROTOCOL]['props'] : ComponentProps

type RegisteredFieldTypeListeners<TRow extends TableRow, TDefinition> =
  TDefinition extends {
    readonly [FIELD_TYPE_PROTOCOL]: { listeners: object }
  }
    ? TDefinition[typeof FIELD_TYPE_PROTOCOL]['listeners']
    : Record<string, FormTableFieldListener<TRow>>

type RegisteredFieldTypeEvents<TDefinition> = TDefinition extends {
  readonly [FIELD_TYPE_PROTOCOL]: { events: infer TEvents }
}
  ? TEvents extends Record<keyof TEvents, unknown[]>
    ? TEvents
    : FieldTypeEventMap
  : FieldTypeEventMap

type RegisteredFieldTypeDefinition<TFieldTypes, TType extends PropertyKey> =
  TFieldTypes extends Record<TType, infer TDefinition>
    ? TDefinition
    : never

type CustomFieldComponentConfig<
  TRow extends TableRow,
  TDefinition
> = {
  props?: DynamicValue<
    Partial<RegisteredFieldTypeProps<TDefinition>>,
    FormTableFieldRenderContext<TRow>
  >
  listeners?: RegisteredFieldTypeListeners<TRow, TDefinition>
  model?: FieldModelConfig<TRow, RegisteredFieldTypeEvents<TDefinition>> | false
  is?: never
  resolveComponent?: never
  slot?: never
  options?: never
  optionProps?: never
}

type CustomFormItemConfig<
  TRow extends TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow>
> = {
  [TType in RegisteredFormItemType<TFieldTypes>]: BaseFormItemConfig<TRow> & {
    type: TType
    component?: CustomFieldComponentConfig<
      TRow,
      RegisteredFieldTypeDefinition<TFieldTypes, TType>
    >
  }
}[RegisteredFormItemType<TFieldTypes>]

/** FormTable 支持的内置、直接组件、Slot 和已注册自定义字段配置联合。 */
export type FormItemConfig<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> =
  | BuiltinFormItemConfig<TRow>
  | ComponentFormItemConfig<TRow>
  | SlotFormItemConfig<TRow>
  | CustomFormItemConfig<TRow, TFieldTypes>
