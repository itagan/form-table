<template>
  <el-form-item v-bind="resolvedFormItemProps">
    <SlotRenderer
      v-if="config.type === 'slot' && slotFn"
      :slot-fn="slotFn"
      :slot-props="slotContext"
    />
    <span v-else-if="config.type === 'slot'" />
    <span v-else-if="!config.type">{{ slotContext.value }}</span>
    <ComponentWrapper
      v-else
      :type="config.type"
      :value="fieldContext.value"
      :component="resolvedComponent"
      @input="fieldContext.setValue"
    />
  </el-form-item>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'
import SlotRenderer from './SlotRenderer'
import { getComponentType, getRequiredProps } from './configs/defaultComponentConfigs'
import type {
  BuiltinFormItemType,
  FormItemConfig,
  FormItemOption,
  FormTableFieldContext,
  FormTableRowContext,
  FormTableSlotContext,
  FormTableSlots,
  FormTableUpdateApi,
  OptionPropsConfig,
  ResolvedComponentConfig,
  TableRow
} from './types'
import {
  FORM_TABLE_SLOTS_KEY,
  FORM_TABLE_UPDATE_KEY
} from './types'
import {
  createFieldRenderContext,
  resolveDynamicValue
} from './utils/dynamic'

/** 当前字段配置及其所在行的完整动态上下文。 */
const props = defineProps<{
  rowContext: FormTableRowContext
  config: FormItemConfig
}>()

/** 根组件下发的数据更新入口。缺失时字段仍可展示，但不会写回数据。 */
const updateApi = inject<FormTableUpdateApi>(FORM_TABLE_UPDATE_KEY)

/** 父组件具名插槽集合，用于 type="slot" 字段。 */
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})

/** Element UI 表单校验要求的完整模型路径。 */
const propPath = computed(() => `tableData.${props.rowContext.index}.${props.config.fieldKey}`)

/** 在行上下文上补充字段路径、字段值和字段配置。 */
const runtimeContext = computed(() => createFieldRenderContext(
  props.rowContext,
  props.config
))

/**
 * 合并用户 formItemProps，并强制使用与表单模型一致的 prop。
 * hint 只控制 el-form-item 的原生 title；未配置时保留底层 props 透传结果。
 */
const resolvedFormItemProps = computed(() => {
  const formItemProps = resolveDynamicValue(props.config.formItemProps, runtimeContext.value) || {}
  if (!Object.prototype.hasOwnProperty.call(props.config, 'hint')) {
    return { ...formItemProps, prop: propPath.value }
  }

  const otherFormItemProps = { ...formItemProps }
  delete otherFormItemProps.title
  const hint = resolveDynamicValue(props.config.hint, runtimeContext.value)
  return {
    ...otherFormItemProps,
    ...(hint === undefined || hint === null ? {} : { title: hint }),
    prop: propPath.value
  }
})

/** 仅 slot 模式按 renderer 名称查找插槽；未找到时返回 null。 */
const slotFn = computed(() => props.config.type === 'slot'
  ? parentSlots[props.config.component.renderer] || null
  : null)

/** 在只读渲染上下文上增加安全的数据更新方法，供监听器和插槽使用。 */
const fieldContext = computed<FormTableFieldContext>(() => {
  const targetRow = props.rowContext.row as TableRow
  const targetFieldKey = props.config.fieldKey
  return {
    ...runtimeContext.value,
    // 闭包绑定当前行与字段，配置切换后旧事件不会误更新新字段。
    setValue: nextValue => updateApi?.setValue(targetRow, targetFieldKey, nextValue),
    updateRow: patch => updateApi?.updateRow(targetRow, patch)
  }
})

/** 内置类型用于查找默认 Element UI 组件；component/slot 使用配置的 renderer。 */
const builtinType = computed<BuiltinFormItemType | null>(() => {
  return props.config.type === 'component' || props.config.type === 'slot'
    ? null
    : props.config.type
})

/** 按渲染模式解析最终组件，保留可辨识联合的类型收窄。 */
const resolveFieldRenderer = () => {
  const config = props.config
  if (config.type === 'component') {
    return config.component.resolveRenderer?.(runtimeContext.value) ?? config.component.renderer
  }
  if (config.type === 'slot') return config.component.renderer
  return getComponentType(config.type)
}

/** 动态字段配置集中解析一次，渲染层只消费结果，避免重复执行用户回调。 */
const resolvedComponent = computed<ResolvedComponentConfig>(() => {
  const component = props.config.component
  const listeners = component?.listeners || {}
  const resolvedListeners = Object.keys(listeners).reduce<Record<string, (...args: unknown[]) => void>>((result, name) => {
    result[name] = (...args) => listeners[name]?.(fieldContext.value, ...args)
    return result
  }, {})

  return {
    renderer: resolveFieldRenderer(),
    props: {
      ...(builtinType.value ? getRequiredProps(builtinType.value) : {}),
      ...(resolveDynamicValue(component?.props, runtimeContext.value) || {})
    },
    listeners: resolvedListeners,
    options: resolveDynamicValue(component?.options, runtimeContext.value) as FormItemOption[] || [],
    optionProps: resolveDynamicValue(component?.optionProps, runtimeContext.value) as OptionPropsConfig | undefined,
    model: component?.model
  }
})

/** 插槽上下文额外暴露校验路径和已经解析完成的组件配置。 */
const slotContext = computed<FormTableSlotContext>(() => ({
  ...fieldContext.value,
  propPath: propPath.value,
  component: resolvedComponent.value
}))
</script>
