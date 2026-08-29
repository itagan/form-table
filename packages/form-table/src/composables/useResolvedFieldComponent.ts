import { computed } from 'vue'
import type { Ref } from 'vue'
import {
  getComponentType,
  isBuiltinFormItemType,
  isReservedFormItemType
} from '../configs/defaultComponentConfigs'
import type {
  FormItemConfig,
  FieldTypeDefinition,
  FieldTypeRegistry,
  FormTableFieldBindingContext,
  FormTableFieldContext,
  FormTableFieldRenderContext,
  FormTableHintMode,
  FormTableHintTrigger,
  ResolvedComponentConfig,
  TableRow
} from '../types'
import { resolveDynamicValue } from '../utils/dynamic'
import { applyHintComponentProps } from '../utils/hint'

interface ResolvedFieldComponentOptions<TRow extends TableRow> {
  getConfig: () => FormItemConfig<TRow>
  runtimeContext: Readonly<Ref<FormTableFieldRenderContext<TRow>>>
  bindingContext: Readonly<Ref<FormTableFieldBindingContext<TRow>>>
  fieldContext: Readonly<Ref<FormTableFieldContext<TRow>>>
  resolvedHint: Readonly<Ref<string | null>>
  hintMode: Readonly<Ref<FormTableHintMode>>
  hintTrigger: Readonly<Ref<FormTableHintTrigger>>
  fieldTypes: Readonly<Ref<FieldTypeRegistry<TRow>>>
}

const resolveTypeDefinition = <TRow extends TableRow>(
  type: string,
  fieldTypes: FieldTypeRegistry<TRow>
): FieldTypeDefinition<TRow> | undefined => {
  if (isReservedFormItemType(type)) return undefined
  return Object.prototype.hasOwnProperty.call(fieldTypes, type)
    ? fieldTypes[type]
    : undefined
}

/** 按字段类型优先级选择唯一组件目标，不读取注册表或其他响应式状态。 */
const resolveComponentTarget = <TRow extends TableRow>(
  config: FormItemConfig<TRow>,
  context: FormTableFieldRenderContext<TRow>,
  typeDefinition: FieldTypeDefinition<TRow> | undefined
) => {
  if (config.type === 'component') {
    return config.component.resolveComponent?.(context) ?? config.component.is
  }
  if (config.type === 'slot') return undefined
  if (isBuiltinFormItemType(config.type)) return getComponentType(config.type)
  return typeDefinition?.is
}

/**
 * 将公开的字段配置归一化为函数式字段渲染器可直接消费的渲染配置。
 * 动态组件、props 和 options 都集中在同一个 computed 中求值一次。
 */
export function useResolvedFieldComponent<TRow extends TableRow = TableRow>(
  options: ResolvedFieldComponentOptions<TRow>
) {
  const resolvedComponent = computed<ResolvedComponentConfig<TRow>>(() => {
    const config = options.getConfig()
    const context = options.runtimeContext.value
    const propsContext = options.bindingContext.value
    const component = config.component
    const typeDefinition = resolveTypeDefinition(config.type, options.fieldTypes.value)
    const listeners = component?.listeners || {}
    const defaultProps = resolveDynamicValue(typeDefinition?.props, propsContext) || {}
    const componentProps = {
      ...defaultProps,
      ...(resolveDynamicValue(component?.props, propsContext) || {})
    }

    /** 保留原始事件参数，并在首位注入带安全更新助手的字段上下文。 */
    const resolvedListeners = Object.keys(listeners).reduce<Record<string, (...args: unknown[]) => void>>((result, name) => {
      result[name] = (...args) => listeners[name]?.(options.fieldContext.value, ...args)
      return result
    }, {})

    return {
      is: resolveComponentTarget(config, context, typeDefinition),
      slot: config.type === 'slot'
        ? config.component.slot
        : undefined,
      props: applyHintComponentProps(
        componentProps,
        options.resolvedHint.value,
        options.hintMode.value,
        options.hintTrigger.value
      ),
      listeners: resolvedListeners,
      options: resolveDynamicValue(component?.options, context) || [],
      optionProps: resolveDynamicValue(component?.optionProps, context),
      model: component?.model ?? typeDefinition?.model
    }
  })

  return { resolvedComponent }
}
