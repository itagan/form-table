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
import { useFormTableFieldContext } from './composables/useFormTableFieldContext'
import { useResolvedFieldComponent } from './composables/useResolvedFieldComponent'
import type {
  FormItemConfig,
  FormTableRowContext,
  FormTableSlotContext,
  FormTableSlots
} from './types'
import { FORM_TABLE_SLOTS_KEY } from './types'
import { extendLazyContext } from './utils/dynamic'

/** 当前字段配置及其所在行的完整动态上下文。 */
const props = defineProps<{
  rowContext: FormTableRowContext
  config: FormItemConfig
}>()

/** 父组件具名插槽集合，用于 type="slot" 字段。 */
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})

/** 字段定位、校验路径和安全写回由上下文组合式 API 统一维护。 */
const {
  propPath,
  runtimeContext,
  resolvedFormItemProps,
  fieldContext
} = useFormTableFieldContext({
  getRowContext: () => props.rowContext,
  getConfig: () => props.config
})

/** 组件选择、动态属性、选项和监听器统一归一化后再交给渲染层。 */
const { resolvedComponent } = useResolvedFieldComponent({
  getConfig: () => props.config,
  runtimeContext,
  fieldContext
})

/** 仅 slot 模式按 renderer 名称查找插槽；未找到时返回 null。 */
const slotFn = computed(() => props.config.type === 'slot'
  ? parentSlots[props.config.component.renderer] || null
  : null)

/** 插槽上下文额外暴露校验路径和已经解析完成的组件配置。 */
const slotContext = computed<FormTableSlotContext>(() => {
  const context = fieldContext.value
  return extendLazyContext(context, {
    get propPath() {
      return propPath.value
    },
    get component() {
      return resolvedComponent.value
    }
  })
})
</script>
