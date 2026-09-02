import type { Component } from 'vue'
import type {
  ComponentProps,
  DynamicValue,
  FormTableValue,
  TableRow
} from '../base'
import type {
  FormTableFieldBindingContext,
  FormTableFieldRenderContext
} from '../context'
import type {
  FieldModelConfig,
  FormTableFieldListener,
  FormTableNativeFieldListeners
} from './field-model'

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
  label?: string
  value?: string
  disabled?: string
  key?: string
}

/** 在行字段路径与组件受控值路径之间建立可序列化的双向映射。 */
export interface FieldBindingMapEntry {
  fieldPath: string
  valuePath: string
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
  props?: DynamicValue<ComponentProps, FormTableFieldBindingContext<TRow>>
  /** 字段组件事件监听器；回调首参固定为可更新的字段上下文。 */
  listeners?: Record<string, FormTableFieldListener<TRow>>
  /** 字段组件根节点的原生 DOM 事件监听器；回调首参固定为可更新的字段上下文。 */
  nativeListeners?: FormTableNativeFieldListeners<TRow>
  /** select、radio、checkbox 等选项型组件的数据源。 */
  options?: DynamicValue<FormItemOption[], FormTableFieldRenderContext<TRow>>
  /** 将业务选项对象字段映射到 label、value、disabled 和 key。 */
  optionProps?: DynamicValue<OptionPropsConfig, FormTableFieldRenderContext<TRow>>
  /** 自定义受控值协议；undefined 使用组件原生 Vue 2 v-model，false 禁用写回。 */
  model?: FieldModelConfig<TRow> | false
}
