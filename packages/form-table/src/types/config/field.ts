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
  fieldPath: string
  valuePath: string
  /** 组件值中无法解析 valuePath 时写入 fieldPath 的兜底值。 */
  fallbackValue?: FormTableValue
}

/** 一个字段渲染项所使用的复合值映射。 */
export interface FieldBindingConfig {
  map: FieldBindingMapEntry[]
}

/** 根据当前字段所在行同步选择实际渲染组件。 */
export type FieldComponentResolver<TRow extends TableRow = TableRow> = (
  context: FormTableFieldRenderContext<TRow>
) => string | Component | undefined

export interface FieldComponentConfig<TRow extends TableRow = TableRow> {
  is?: string | Component
  resolveComponent?: FieldComponentResolver<TRow>
  slot?: string
  props?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  listeners?: Record<string, FormTableFieldListener<TRow>>
  options?: DynamicValue<FormItemOption[], FormTableFieldRenderContext<TRow>>
  optionProps?: DynamicValue<OptionPropsConfig, FormTableFieldRenderContext<TRow>>
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
  key?: string
  fieldKey: string
  binding?: FieldBindingConfig
  /** 使用方挂载的静态业务元数据；FormTable 不解析或消费。 */
  meta?: StaticFormItemMeta
  labelSlot?: string
  errorSlot?: string
  visible?: DynamicValue<boolean, FormTableFieldRenderContext<TRow>>
  colProps?: DynamicValue<ComponentProps, FormTableFieldRenderContext<TRow>>
  formItemProps?: DynamicValue<FormTableFormItemProps, FormTableFieldRenderContext<TRow>>
  hint?: DynamicValue<FormTableHintValue, FormTableFieldRenderContext<TRow>>
  /** item 使用整个 FormItem；content 使用其中唯一可见的内容根节点。 */
  hintTrigger?: FormTableHintTrigger
}

export interface BuiltinFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: BuiltinFormItemType
  component?: FieldComponentConfig<TRow> & { is?: never, resolveComponent?: never, slot?: never }
}

type ComponentTargetConfig<TRow extends TableRow = TableRow> =
  | { is: string | Component, resolveComponent?: FieldComponentResolver<TRow>, slot?: never }
  | { is?: never, resolveComponent: FieldComponentResolver<TRow>, slot?: never }

export interface ComponentFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: 'component'
  component: FieldComponentConfig<TRow> & ComponentTargetConfig<TRow>
}

export interface SlotFormItemConfig<TRow extends TableRow = TableRow> extends BaseFormItemConfig<TRow> {
  type: 'slot'
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

export type FormItemConfig<
  TRow extends TableRow = TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow> = EmptyFieldTypeRegistry
> =
  | BuiltinFormItemConfig<TRow>
  | ComponentFormItemConfig<TRow>
  | SlotFormItemConfig<TRow>
  | CustomFormItemConfig<TRow, TFieldTypes>
