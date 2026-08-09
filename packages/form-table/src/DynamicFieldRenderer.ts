import type {
  Component,
  CreateElement,
  DirectiveOptions,
  RenderContext,
  VNode,
  VNodeData
} from 'vue'
import type {
  ComponentProps,
  FieldModelConfig,
  FormTableValue
} from './types'

interface DynamicFieldRendererProps {
  renderer: string | Component
  value: FormTableValue
  componentProps: ComponentProps
  componentListeners: Record<string, (...args: unknown[]) => void>
  model?: FieldModelConfig | boolean
  onModelInput: (value: FormTableValue) => void
}

/** Vue 2 运行时支持 data.model，但旧版公开 VNodeData 类型未声明该字段。 */
interface ModelVNodeData extends VNodeData {
  model?: {
    value: FormTableValue
    callback: (value: FormTableValue) => void
  }
}

/**
 * Vue 组件可通过 inheritAttrs: false 阻止 title 落到真实 DOM。
 * 指令直接同步组件根元素，在不增加包装节点的前提下统一原生提示行为。
 */
const nativeTitleDirective: DirectiveOptions = {
  bind: (element, binding) => {
    if (binding.value === undefined || binding.value === null) return
    element.setAttribute('title', String(binding.value))
  },
  update: (element, binding) => {
    if (binding.value === undefined || binding.value === null) {
      element.removeAttribute('title')
      return
    }
    element.setAttribute('title', String(binding.value))
  },
  unbind: element => element.removeAttribute('title')
}

/**
 * 将 class/style 从普通 attrs 中分离，保持 v-bind 在组件上的原生 Vue 2 语义。
 */
function createRenderData(
  componentProps: ComponentProps,
  componentListeners: Record<string, (...args: unknown[]) => void>
): ModelVNodeData {
  const { class: className, style, ...attrs } = componentProps
  const data: ModelVNodeData = {
    attrs,
    class: className,
    style,
    on: { ...componentListeners }
  }

  if (Object.prototype.hasOwnProperty.call(componentProps, 'title')) {
    data.directives = [{
      name: 'form-table-native-title',
      value: componentProps.title,
      def: nativeTitleDirective
    }]
  }

  return data
}

/**
 * 函数式动态组件渲染器：不创建额外组件实例，并完整保留子选项节点。
 *
 * model 未配置或为 true 时写入 VNodeData.model，让 Vue 读取真实组件的 model 选项；
 * 对象配置直接绑定指定 prop/event，false 时完全跳过受控值注入。
 */
export default {
  name: 'FormTableDynamicFieldRenderer',
  functional: true,
  props: {
    renderer: { type: [String, Object, Function], required: true },
    value: null,
    componentProps: { type: Object, required: true },
    componentListeners: { type: Object, required: true },
    model: { type: [Object, Boolean], default: undefined },
    onModelInput: { type: Function, required: true }
  },
  render(
    createElement: CreateElement,
    context: RenderContext<DynamicFieldRendererProps>
  ): VNode {
    const {
      renderer,
      value,
      componentProps,
      componentListeners,
      model,
      onModelInput
    } = context.props
    const data = createRenderData(componentProps, componentListeners)

    if (model === undefined || model === true) {
      // 交给 Vue 在运行时识别组件声明的 model.prop/model.event。
      data.model = { value, callback: onModelInput }
    } else if (model !== false) {
      const prop = model.prop || 'value'
      const event = model.event || 'input'
      const configuredListener = componentListeners[event]

      data.attrs = { ...data.attrs, [prop]: value }
      data.on = {
        ...data.on,
        // 与 Vue 原生 v-model 一致：先写回模型，再执行调用方配置的同名监听器。
        [event]: (...args: unknown[]) => {
          const nextValue = model.valueFromEvent
            ? model.valueFromEvent(...args)
            : args[0]
          onModelInput(nextValue)
          configuredListener?.(...args)
        }
      }
    }

    return createElement(renderer as string, data, context.children)
  }
}
