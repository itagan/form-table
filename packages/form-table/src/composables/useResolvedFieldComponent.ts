import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { getComponentType } from '../configs/defaultComponentConfigs'
import type {
  FormItemConfig,
  FormItemOption,
  FormTableFieldContext,
  FormTableFieldRenderContext,
  FormTableHintMode,
  FormTableHintTrigger,
  OptionPropsConfig,
  ResolvedComponentConfig,
  TableRow
} from '../types'
import { resolveDynamicValue } from '../utils/dynamic'
import { applyHintComponentProps } from '../utils/hint'

interface ResolvedFieldComponentOptions<TRow extends TableRow> {
  getConfig: () => FormItemConfig<TRow>
  runtimeContext: ComputedRef<FormTableFieldRenderContext<TRow>>
  fieldContext: ComputedRef<FormTableFieldContext<TRow>>
  resolvedHint: ComputedRef<string | null>
  hintMode: ComputedRef<FormTableHintMode>
  hintTrigger: ComputedRef<FormTableHintTrigger>
}

/**
 * 将公开的字段配置归一化为 ComponentWrapper 可直接消费的渲染配置。
 * 动态组件、props 和 options 都集中在同一个 computed 中求值一次。
 */
export function useResolvedFieldComponent<TRow extends TableRow = TableRow>(
  options: ResolvedFieldComponentOptions<TRow>
) {
  const resolveComponentTarget = (
    config: FormItemConfig<TRow>,
    context: FormTableFieldRenderContext<TRow>
  ) => {
    if (config.type === 'component') {
      return config.component.resolveComponent?.(context)
        ?? config.component.is
    }
    if (config.type === 'slot') return undefined
    return getComponentType(config.type)
  }

  const resolvedComponent = computed<ResolvedComponentConfig>(() => {
    const config = options.getConfig()
    const context = options.runtimeContext.value
    const component = config.component
    const listeners = component?.listeners || {}
    const componentProps = resolveDynamicValue(component?.props, context) || {}

    /** 保留原始事件参数，并在首位注入带安全更新助手的字段上下文。 */
    const resolvedListeners = Object.keys(listeners).reduce<Record<string, (...args: unknown[]) => void>>((result, name) => {
      result[name] = (...args) => listeners[name]?.(options.fieldContext.value, ...args)
      return result
    }, {})

    return {
      is: resolveComponentTarget(config, context),
      slot: config.type === 'slot' ? config.component.slot : undefined,
      props: applyHintComponentProps(
        componentProps,
        options.resolvedHint.value,
        options.hintMode.value,
        options.hintTrigger.value
      ),
      listeners: resolvedListeners,
      options: resolveDynamicValue(component?.options, context) as FormItemOption[] || [],
      optionProps: resolveDynamicValue(
        component?.optionProps,
        context
      ) as OptionPropsConfig | undefined,
      model: component?.model
    }
  })

  return { resolvedComponent }
}
