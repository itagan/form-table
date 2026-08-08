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

const props = defineProps<{
  rowContext: FormTableRowContext
  config: FormItemConfig
}>()

const updateApi = inject<FormTableUpdateApi>(FORM_TABLE_UPDATE_KEY)
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})
const propPath = computed(() => `tableData.${props.rowContext.index}.${props.config.fieldKey}`)
const runtimeContext = computed(() => createFieldRenderContext(
  props.rowContext,
  props.config
))
const resolvedFormItemProps = computed(() => ({
  ...(resolveDynamicValue(props.config.formItemProps, runtimeContext.value) || {}),
  prop: propPath.value
}))
const slotFn = computed(() => props.config.type === 'slot'
  ? parentSlots[props.config.component.renderer] || null
  : null)
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

const builtinType = computed<BuiltinFormItemType | null>(() => {
  return props.config.type === 'component' || props.config.type === 'slot'
    ? null
    : props.config.type
})

/** 动态字段配置集中解析一次，渲染层只消费结果，避免重复执行用户回调。 */
const resolvedComponent = computed<ResolvedComponentConfig>(() => {
  const component = props.config.component
  const listeners = component?.listeners || {}
  const resolvedListeners = Object.keys(listeners).reduce<Record<string, (...args: unknown[]) => void>>((result, name) => {
    result[name] = (...args) => listeners[name]?.(fieldContext.value, ...args)
    return result
  }, {})

  return {
    renderer: props.config.type === 'component' || props.config.type === 'slot'
      ? component?.renderer
      : getComponentType(builtinType.value as BuiltinFormItemType),
    props: {
      ...(builtinType.value ? getRequiredProps(builtinType.value) : {}),
      ...(resolveDynamicValue(component?.props, runtimeContext.value) || {})
    },
    listeners: resolvedListeners,
    options: resolveDynamicValue(component?.options, runtimeContext.value) as FormItemOption[] || [],
    optionProps: resolveDynamicValue(component?.optionProps, runtimeContext.value) as OptionPropsConfig | undefined
  }
})
const slotContext = computed<FormTableSlotContext>(() => ({
  ...fieldContext.value,
  propPath: propPath.value,
  component: resolvedComponent.value
}))
</script>
