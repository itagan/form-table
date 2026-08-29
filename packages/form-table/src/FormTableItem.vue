<template>
  <el-form-item
    v-bind="resolvedFormItemProps"
    :data-form-table-field-prop="propPath"
  >
    <template v-if="labelSlotFn && hasLabelSlot()" v-slot:label>
      <SlotRenderer
        :slot-fn="labelSlotFn"
        :slot-props="formItemSlotContext"
      />
    </template>

    <template v-if="errorSlotFn && hasErrorSlot()" v-slot:error="{ error }">
      <SlotRenderer
        :slot-fn="errorSlotFn"
        :slot-props="createErrorSlotContext(error)"
      />
    </template>

    <SlotRenderer
      v-if="config.type === 'slot' && slotFn && hasFieldSlot()"
      :slot-fn="slotFn"
      :slot-props="slotContext"
    />
    <span v-else-if="config.type === 'slot'" />
    <FieldRenderer
      v-else
      :type="config.type"
      :value="fieldContext.bindingValue"
      :model-context="runtimeContext"
      :component="resolvedComponent"
      :on-model-input="fieldContext.setBindingValue"
    />
  </el-form-item>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import FieldRenderer from './FieldRenderer'
import SlotRenderer from './SlotRenderer'
import { useFormTableFieldContext } from './composables/useFormTableFieldContext'
import { useResolvedFieldComponent } from './composables/useResolvedFieldComponent'
import type {
  FormItemConfig,
  FieldTypeRegistry,
  FormTableFieldTypesRef,
  FormTableFormItemErrorSlotContext,
  FormTableFormItemSlotContext,
  FormTableRowContext,
  FormTableSlotContext,
  FormTableSlots
} from './types'
import { FORM_TABLE_FIELD_TYPES_KEY, FORM_TABLE_SLOTS_KEY } from './types/internal'
import { extendLazyContext } from './utils/dynamic'

/** 当前字段配置及其所在行的完整动态上下文。 */
const props = defineProps<{
  rowContext: FormTableRowContext
  config: FormItemConfig
}>()

/** 父组件具名插槽集合，用于字段 Slot 和 FormItem Label/Error Slot。 */
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, () => ({}), true)
const fieldTypes = inject<FormTableFieldTypesRef>(
  FORM_TABLE_FIELD_TYPES_KEY,
  () => computed<FieldTypeRegistry>(() => ({})),
  true
)

/** 包装函数随配置更新，调用时再解析父组件最新的 Label/Error Slot。 */
const labelSlotFn = computed(() => {
  const slotName = props.config.labelSlot
  if (!slotName) return null
  return (context: FormTableFormItemSlotContext) => parentSlots[slotName]?.(context) ?? null
})
const errorSlotFn = computed(() => {
  const slotName = props.config.errorSlot
  if (!slotName) return null
  return (context: FormTableFormItemErrorSlotContext) => parentSlots[slotName]?.(context) ?? null
})
const hasLabelSlot = () => Boolean(
  props.config.labelSlot && parentSlots[props.config.labelSlot]
)
const hasErrorSlot = () => Boolean(
  props.config.errorSlot && parentSlots[props.config.errorSlot]
)

/** 字段定位、校验路径和安全写回由上下文组合式 API 统一维护。 */
const {
  propPath,
  runtimeContext,
  resolvedHint,
  hintMode,
  hintTrigger,
  resolvedFormItemProps,
  bindingContext,
  fieldContext
} = useFormTableFieldContext({
  getRowContext: () => props.rowContext,
  getConfig: () => props.config
})

/** 组件选择、动态属性、选项和监听器统一归一化后再交给无实例渲染层。 */
const { resolvedComponent } = useResolvedFieldComponent({
  getConfig: () => props.config,
  runtimeContext,
  bindingContext,
  fieldContext,
  resolvedHint,
  hintMode,
  hintTrigger,
  fieldTypes
})

/** 字段内容 Slot 同样只缓存稳定包装函数，避免持有父级旧闭包。 */
const slotFn = computed(() => {
  if (props.config.type !== 'slot') return null
  const slotName = props.config.component.slot
  return (context: FormTableSlotContext) => parentSlots[slotName]?.(context) ?? null
})
const hasFieldSlot = () => props.config.type === 'slot'
  && Boolean(parentSlots[props.config.component.slot])

/** Label/Error 共用字段更新能力和当前响应式校验路径。 */
const formItemSlotContext = computed<FormTableFormItemSlotContext>(() => {
  const context = fieldContext.value
  return extendLazyContext(context, {
    get propPath() {
      return propPath.value
    }
  })
})

/** Error Slot 在通用 FormItem 上下文上增加 Element 当前错误文本。 */
const createErrorSlotContext = (error: string): FormTableFormItemErrorSlotContext => (
  extendLazyContext(formItemSlotContext.value, { error })
)

/** 字段内容 Slot 继续额外暴露已解析完成的组件配置。 */
const slotContext = computed<FormTableSlotContext>(() => {
  return extendLazyContext(formItemSlotContext.value, {
    get component() {
      return resolvedComponent.value
    }
  })
})
</script>
