import type { Component } from 'vue'
import type {
  ComponentProps,
  DynamicValue,
  FormTableValue,
  TableRow
} from '../base'
import type {
  FormTableFieldBindingContext,
  FormTableFieldContext,
  FormTableFieldRenderContext
} from '../context'

/** 字段组件事件监听器签名，第一个参数固定为字段上下文。 */
export type FormTableFieldListener<TRow extends TableRow = TableRow> = (
  context: FormTableFieldContext<TRow>,
  ...args: unknown[]
) => void

interface BaseFieldModelConfig<TRow extends TableRow> {
  prop?: string
  /** 将行字段或 binding.map 组合值同步转换为组件 model prop。 */
  valueToProp?: (
    context: FormTableFieldRenderContext<TRow>,
    bindingValue: FormTableValue
  ) => FormTableValue
}

/** 严格事件回调仍可存入运行时使用的宽松字段注册表。 */
type FieldModelValueFromEvent<TRow extends TableRow, TArgs extends unknown[]> = {
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
  props?: DynamicValue<Partial<TProps>, FormTableFieldBindingContext<TRow>>
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
  TFieldTypes extends Record<TType, infer TDefinition> ? TDefinition : never

/** 根据注册表中的组件协议约束自定义字段的 props、事件与 model。 */
export type RegisteredFieldComponentConfig<
  TRow extends TableRow,
  TFieldTypes,
  TType extends PropertyKey
> = {
  props?: DynamicValue<
    Partial<RegisteredFieldTypeProps<RegisteredFieldTypeDefinition<TFieldTypes, TType>>>,
    FormTableFieldBindingContext<TRow>
  >
  listeners?: RegisteredFieldTypeListeners<
    TRow,
    RegisteredFieldTypeDefinition<TFieldTypes, TType>
  >
  model?: FieldModelConfig<
    TRow,
    RegisteredFieldTypeEvents<RegisteredFieldTypeDefinition<TFieldTypes, TType>>
  > | false
  is?: never
  resolveComponent?: never
  slot?: never
  options?: never
  optionProps?: never
}
