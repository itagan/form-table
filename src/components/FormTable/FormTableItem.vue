<template>
  <el-form-item 
    :prop="propPath" 
    :rules="effectiveRules"
    :label="label"
    :label-width="labelWidth"
    v-bind="attrs"
  >
    <!-- 插槽组件: 从 FormTable 顶层注入的 $slots 中取具名插槽 -->
    <SlotRenderer
      v-if="config.type === 'slotComponent' && config.slotName && slotFn"
      :slot-fn="slotFn"
      :slot-props="slotProps"
    />

    <span v-else-if="config.type === 'slotComponent'" class="form-table-slot-fallback" />
    
    <!-- 带Tooltip的组件 -->
    <el-tooltip 
      v-else-if="isUseTooltip"
      effect="dark" 
      :disabled="!hasContent" 
      :content="tooltipContent" 
      placement="top-start" 
      v-bind="tooltipProps"
    >
      <ComponentWrapper v-bind="wrapperProps" />
    </el-tooltip>
    
    <!-- 普通组件 -->
    <ComponentWrapper v-else v-bind="wrapperProps" />
  </el-form-item>
</template>

<script lang="ts" setup>
/**
 * FormTableItem - 表单项渲染
 *
 * 负责渲染单个表单字段，包含三种模式:
 * 1. slotComponent: 通过 slotName 具名插槽自定义渲染
 * 2. 带 Tooltip: isUseTooltip=true 时，内容超出用 el-tooltip 展示
 * 3. 普通组件: 由 ComponentWrapper 根据 type 动态渲染
 */
import { computed, defineComponent, h, inject, type ComputedRef, useAttrs } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'
import type {
  FormItemConfig,
  FormTableBaseContext,
  FormTableSlotContext,
  ValidationRule
} from './types'
import {
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_DISPATCH_KEY,
  FORM_TABLE_RULES_KEY,
  FORM_TABLE_SLOTS_KEY,
  type DispatchFn
} from './types'
import { createRuntimeContext } from './utils/dynamic'
import { resolveDisplayValue } from './utils/display'
import { resolveRulesForProp } from './utils/rules'

// 渲染顶层插槽的包装组件，用 div 包裹以兼容 Vue 2 单根节点要求
const SlotRenderer = defineComponent({
  props: {
    slotFn: { type: Function, required: true as true },
    slotProps: { type: Object, required: true as true }
  },
  setup(props) {
    return () => h('div', props.slotFn(props.slotProps))
  }
})

interface Props {
  propPath: string
  rules?: any[]
  label?: string
  labelWidth?: string
  isUseTooltip?: boolean
  tooltipProps?: Record<string, any>
  row: Record<string, any>
  index: number
  config: FormItemConfig
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  labelWidth: 'auto',
  isUseTooltip: false,
  tooltipProps: () => ({})
})

const attrs = useAttrs()
const formTableContext = inject<ComputedRef<FormTableBaseContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ formData: {}, tableData: [] }))
)
const dispatch = inject<DispatchFn>(FORM_TABLE_DISPATCH_KEY)
const formRules = inject<ComputedRef<Record<string, ValidationRule[]>>>(FORM_TABLE_RULES_KEY, computed(() => ({})))
const parentSlots = inject(FORM_TABLE_SLOTS_KEY, {} as Record<string, any>)

// 从顶层 FormTable 注入的 slots 中取出对应具名插槽函数
const slotFn = computed(() => {
  return parentSlots[props.config.slotName!] || null
})

const setValue = (value: any) => {
  if (props.row[props.config.key] === value) {
    return
  }

  if (dispatch) {
    dispatch('update:row', props.index, props.row, props.config.key, value)
    return
  }

  props.row[props.config.key] = value
}

const updateRow = (patch: Record<string, any>) => {
  if (dispatch) {
    dispatch('update:row-data', props.index, patch)
    return
  }

  Object.assign(props.row, patch)
}

const runtimeContext = computed(() => createRuntimeContext(formTableContext.value, {
  row: props.row,
  index: props.index,
  fieldKey: props.config.key
}))

const slotProps = computed<FormTableSlotContext>(() => ({
  row: props.row,
  index: props.index,
  fieldKey: props.config.key,
  propPath: props.propPath,
  value: props.row[props.config.key],
  formData: formTableContext.value.formData,
  tableData: formTableContext.value.tableData,
  setValue,
  updateRow
}))

const effectiveRules = computed(() => {
  const inheritedRules = resolveRulesForProp(formRules.value, props.propPath)
  const localRules = props.rules || []
  const mergedRules = [...inheritedRules, ...localRules]

  return mergedRules.length > 0 ? mergedRules : undefined
})

const wrapperProps = computed(() => {
  const {
    key,
    type,
    visible,
    customComponent,
    colProps,
    bind,
    rules,
    label,
    labelWidth,
    isUseTooltip,
    tooltipProps,
    colSpan,
    defaultValue,
    ...componentConfig
  } = props.config

  return {
    type,
    fieldKey: key,
    row: props.row,
    rowIndex: props.index,
    customComponent,
    bind,
    ...componentConfig
  }
})

const hasContent = computed(() => {
  const value = props.row[props.config.key]
  return value !== null && value !== undefined && value !== ''
})

const tooltipContent = computed(() => {
  const displayValue = resolveDisplayValue(
    props.row[props.config.key],
    props.config.options,
    props.config.optionProps,
    props.config.formatter,
    props.config.emptyText,
    runtimeContext.value
  )

  return displayValue !== null && displayValue !== undefined ? String(displayValue) : ''
})
</script>
