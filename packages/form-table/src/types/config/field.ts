import type { Component } from 'vue'
import type {
  ComponentProps,
  DynamicValue,
  FormTableFormItemProps,
  FormTableHintTrigger,
  FormTableHintValue,
  FormTableRecord,
  TableRow
} from '../base'
import type { FormTableFieldRenderContext } from '../context'
import type {
  FieldBindingConfig,
  FieldComponentConfig,
  FieldComponentResolver
} from './field-component'
import type {
  EmptyFieldTypeRegistry,
  FieldTypeRegistry,
  RegisteredFieldComponentConfig
} from './field-model'

export type {
  FieldBindingConfig,
  FieldBindingMapEntry,
  FieldComponentConfig,
  FieldComponentResolver,
  FormItemOption,
  OptionPropsConfig
} from './field-component'
export type {
  EmptyFieldTypeRegistry,
  FieldModelConfig,
  FieldTypeDefinition,
  FieldTypeEventMap,
  FieldTypeListeners,
  FieldTypeRegistry,
  FormTableFieldListener,
  TypedFieldTypeDefinition
} from './field-model'

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

type CustomFormItemConfig<
  TRow extends TableRow,
  TFieldTypes extends FieldTypeRegistry<TRow>
> = {
  [TType in RegisteredFormItemType<TFieldTypes>]: BaseFormItemConfig<TRow> & {
    type: TType
    component?: RegisteredFieldComponentConfig<TRow, TFieldTypes, TType>
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
