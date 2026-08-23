import type {
  Component,
  CreateElement,
  RenderContext,
  VNode,
  VNodeData
} from 'vue'
import type {
  ComponentProps,
  FieldModelConfig,
  FormTableFieldRenderContext,
  FormTableValue
} from './types'

interface DynamicFieldRendererProps {
  renderer: string | Component
  value: FormTableValue
  componentProps: ComponentProps
  componentListeners: Record<string, (...args: unknown[]) => void>
  model?: FieldModelConfig | false
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

/**
 * 将 class/style 从普通 attrs 中分离，保持 v-bind 在组件上的原生 Vue 2 语义。
 */
function createRenderData(
  componentProps: ComponentProps,
  componentListeners: Record<string, (...args: unknown[]) => void>
): ModelVNodeData {
  const { class: className, style, ...attrs } = componentProps
  return {
    attrs,
    class: className,
    style,
    on: { ...componentListeners }
  }
}

/**
 * 函数式动态组件渲染器：不创建额外组件实例，并完整保留子选项节点。
 *
 * model 未配置时写入 VNodeData.model，让 Vue 读取真实组件的 model 选项；
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
    modelContext: { type: Object, required: true },
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
      modelContext,
      onModelInput
    } = context.props
    const data = createRenderData(componentProps, componentListeners)

    if (model === undefined) {
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
            ? model.valueFromEvent(modelContext, ...args)
            : args[0]
          onModelInput(nextValue)
          configuredListener?.(...args)
        }
      }
    }

    return createElement(renderer as string, data, context.children)
  }
}
