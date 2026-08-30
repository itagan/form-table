import { computed } from 'vue'
import type { Ref } from 'vue'
import {
  getComponentType,
  isBuiltinFormItemType,
  isReservedFormItemType
} from '../configs/defaultComponentConfigs'
import type {
  FormItemConfig,
  FieldComponentConfig,
  FormTableFieldListener,
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
import type { ComponentProps } from '../types/base'
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

const resolveComponentProps = <TRow extends TableRow>(
  component: FieldComponentConfig<TRow> | undefined,
  typeDefinition: FieldTypeDefinition<TRow> | undefined,
  context: FormTableFieldBindingContext<TRow>
): ComponentProps => ({
  ...(resolveDynamicValue(typeDefinition?.props, context) || {}),
  ...(resolveDynamicValue(component?.props, context) || {})
})

const resolveComponentListeners = <TRow extends TableRow>(
  listeners: Record<string, FormTableFieldListener<TRow>>,
  getFieldContext: () => FormTableFieldContext<TRow>
) => {
  const resolved: Record<string, (...args: unknown[]) => void> = {}
  for (const name of Object.keys(listeners)) {
    resolved[name] = (...args) => listeners[name]?.(getFieldContext(), ...args)
  }
  return resolved
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

    return {
      is: resolveComponentTarget(config, context, typeDefinition),
      slot: config.type === 'slot'
        ? config.component.slot
        : undefined,
      props: applyHintComponentProps(
        resolveComponentProps(component, typeDefinition, propsContext),
        options.resolvedHint.value,
        options.hintMode.value,
        options.hintTrigger.value
      ),
      listeners: resolveComponentListeners(listeners, () => options.fieldContext.value),
      options: resolveDynamicValue(component?.options, context) || [],
      optionProps: resolveDynamicValue(component?.optionProps, context),
      model: component?.model ?? typeDefinition?.model
    }
  })

  return { resolvedComponent }
}
