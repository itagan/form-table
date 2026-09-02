import type {
  Component,
  CreateElement,
  RenderContext,
  VNode,
  VNodeData
} from 'vue'
import type {
  ComponentProps,
  FormItemOption,
  FormItemType,
  FormTableFieldRenderContext,
  FormTableValue,
  OptionPropsConfig,
  ResolvedComponentConfig
} from './types'
import {
  getOptionDisabled,
  getOptionKey,
  getOptionLabel,
  getOptionValue
} from './utils/display'

interface FieldRendererProps {
  type: FormItemType
  value: FormTableValue
  component: ResolvedComponentConfig
  modelContext: FormTableFieldRenderContext
  onModelInput: (value: FormTableValue) => void
}

/** Vue 2 运行时支持 data.model，但旧版公开 VNodeData 类型未声明该字段。 */
interface ModelVNodeData extends VNodeData {
  model?: {
    value: FormTableValue
    callback: (value: FormTableValue) => void
  }
}

/** Element UI 为这些内置字段根节点声明了固定像素宽度，表格内统一适配可用列宽。 */
const FULL_WIDTH_BUILTIN_TYPES = new Set<FormItemType>([
  'number',
  'date',
  'time',
  'time-select'
])

const OPTION_COMPONENTS: Partial<Record<FormItemType, string>> = {
  select: 'el-option',
  radio: 'el-radio',
  checkbox: 'el-checkbox'
}

/** 将 class/style 从普通 attrs 中分离，保持模板 v-bind 在组件上的原生语义。 */
function createRenderData(
  componentProps: ComponentProps,
  componentListeners: Record<string, (...args: unknown[]) => void>,
  nativeListeners: Record<string, (event: Event) => void>,
  isNativeElement = false
): ModelVNodeData {
  const { class: className, style, ...attrs } = componentProps
  const data: ModelVNodeData = {
    attrs,
    class: className,
    style,
    on: { ...componentListeners }
  }
  if (isNativeElement) {
    for (const name of Object.keys(nativeListeners)) {
      const componentListener = componentListeners[name]
      const nativeListener = nativeListeners[name]
      data.on![name] = componentListener
        ? (...args: unknown[]) => {
            componentListener(...args)
            nativeListener(args[0] as Event)
          }
        : nativeListener
    }
  } else {
    data.nativeOn = { ...nativeListeners }
  }
  return data
}

function createOptionChildren(
  createElement: CreateElement,
  type: FormItemType,
  options: FormItemOption[],
  optionProps?: OptionPropsConfig
): VNode[] | undefined {
  const optionComponent = OPTION_COMPONENTS[type]
  if (!optionComponent) return undefined
  const isSelect = type === 'select'

  return options.map((option, optionIndex) => {
    const label = getOptionLabel(option, optionProps)
    const data: VNodeData = {
      key: getOptionKey(option, optionIndex, optionProps),
      attrs: {
        label: isSelect ? label : getOptionValue(option, optionProps),
        value: isSelect ? getOptionValue(option, optionProps) : undefined,
        disabled: getOptionDisabled(option, optionProps)
      }
    }

    return createElement(
      optionComponent,
      data,
      isSelect ? undefined : [String(label ?? '')]
    )
  })
}

function applyModelBinding(
  data: ModelVNodeData,
  component: ResolvedComponentConfig,
  modelContext: FormTableFieldRenderContext,
  value: FormTableValue,
  onModelInput: (value: FormTableValue) => void
) {
  const model = component.model
  const modelValue = model && model.valueToProp
    ? model.valueToProp(modelContext, value)
    : value

  if (model === undefined) {
    // 交给 Vue 在运行时识别组件声明的 model.prop/model.event。
    data.model = { value: modelValue, callback: onModelInput }
    return
  }
  if (model === false) return

  const prop = model.prop || 'value'
  const event = model.event || 'input'
  const configuredListener = component.listeners[event]

  data.attrs = { ...data.attrs, [prop]: modelValue }
  data.on = {
    ...data.on,
    // 与 Vue 原生 v-model 一致：先写回模型，再执行调用方配置的同名监听器。
    [event]: (...args: unknown[]) => {
      const nextValue = model.valueFromEvent
        ? model.valueFromEvent(modelContext, ...args)
        : args[0]
      onModelInput(nextValue)
      configuredListener?.(...args)
    }
  }
}

/**
 * 无实例字段渲染器：集中处理展示、选项和自定义 model 协议。
 * FormTableItem 继续独立负责字段上下文、校验和 Slot。
 */
export default {
  name: 'FormTableFieldRenderer',
  functional: true,
  props: {
    type: { type: String, required: true },
    value: null,
    component: { type: Object, required: true },
    modelContext: { type: Object, required: true },
    onModelInput: { type: Function, required: true }
  },
  render(
    createElement: CreateElement,
    context: RenderContext<FieldRendererProps>
  ): VNode {
    const {
      type,
      value,
      component,
      modelContext,
      onModelInput
    } = context.props

    if (type === 'text') {
      return createElement(
        'span',
        createRenderData(
          component.props,
          component.listeners,
          component.nativeListeners,
          true
        ),
        [String(value ?? '')]
      )
    }

    if (!component.is) return createElement('span')

    const data = createRenderData(
      component.props,
      component.listeners,
      component.nativeListeners
    )
    if (FULL_WIDTH_BUILTIN_TYPES.has(type)) {
      data.class = ['form-table-field-control--full', data.class]
    }
    applyModelBinding(data, component, modelContext, value, onModelInput)

    return createElement(
      component.is as string | Component,
      data,
      createOptionChildren(createElement, type, component.options, component.optionProps)
    )
  }
}
