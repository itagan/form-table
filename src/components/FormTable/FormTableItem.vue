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
      v-if="config.type === 'slot' && slotName && slotFn"
      :slot-fn="slotFn"
      :slot-props="slotProps"
    />

    <span v-else-if="config.type === 'slot'" class="form-table-slot-fallback" />
    
    <!-- 带Tooltip的组件 -->
    <el-tooltip 
      v-else-if="isTooltipEnabled"
      effect="dark" 
      :disabled="!hasContent" 
      :content="tooltipContent" 
      placement="top-start" 
      v-bind="resolvedTooltipProps"
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
 * 1. slot: 通过 slotName 具名插槽自定义渲染
 * 2. 带 Tooltip: display.tooltip=true 时，内容超出用 el-tooltip 展示
 * 3. 普通组件: 由 ComponentWrapper 根据 type 动态渲染
 */
import { computed, defineComponent, h, inject, type ComputedRef, useAttrs } from 'vue'
import ComponentWrapper from './ComponentWrapper.vue'
import type {
  FormTableActions,
  FormItemConfig,
  FormTableBaseContext,
  FormTableRecord,
  FormTableSlotContext,
  FormTableSlots,
  FormTableValue,
  ValidationRule
} from './types'
import {
  FORM_TABLE_ACTIONS_KEY,
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_DISPATCH_KEY,
  FORM_TABLE_RULES_KEY,
  FORM_TABLE_SLOTS_KEY,
  type ComponentBind,
  type DispatchFn
} from './types'
import { createRuntimeContext } from './utils/dynamic'
import { resolveDisplayValue } from './utils/display'
import { createFallbackFormTableActions } from './utils/actions'
import {
  getFormItemCustomComponent,
  getFormItemEmptyText,
  getFormItemFormatter,
  getFormItemListeners,
  getFormItemSlotName,
  isFormItemTooltipEnabled,
  resolveFormItemBind,
  resolveFormItemOptions,
  resolveFormItemOptionProps,
  resolveFormItemTooltipProps
} from './utils/fieldConfig'
import { getValueByPath } from './utils/path'
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
  row: FormTableRecord
  index: number
  config: FormItemConfig
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  labelWidth: 'auto'
})

const attrs = useAttrs()
const formTableActions = inject<FormTableActions>(FORM_TABLE_ACTIONS_KEY, createFallbackFormTableActions())
const formTableContext = inject<ComputedRef<FormTableBaseContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ formData: {}, tableData: [] }))
)
const dispatch = inject<DispatchFn>(FORM_TABLE_DISPATCH_KEY)
const formRules = inject<ComputedRef<Record<string, ValidationRule[]>>>(FORM_TABLE_RULES_KEY, computed(() => ({})))
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})

// 从顶层 FormTable 注入的 slots 中取出对应具名插槽函数
const slotName = computed(() => getFormItemSlotName(props.config))
const slotFn = computed(() => {
  return slotName.value ? parentSlots[slotName.value] || null : null
})

/**
 * 更新当前字段值。
 *
 * 插槽和内置组件都通过 dispatch 进入 FormTable 主组件，确保字段联动、
 * field-change 事件和 update:tableData 的行为一致。
 */
const setValue = (value: FormTableValue) => {
  if (getValueByPath(props.row, props.config.key) === value) {
    return
  }

  if (dispatch) {
    dispatch('update:row', props.index, props.row, props.config.key, value)
    return
  }

  props.row[props.config.key] = value
}

/**
 * 批量更新当前行。
 *
 * slot 自定义内容可以通过它提交多个字段的 patch，而不需要直接修改 row。
 */
const updateRow = (patch: Partial<FormTableRecord>) => {
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

const resolvedTooltipProps = computed<ComponentBind>(() => {
  return resolveFormItemTooltipProps(props.config, runtimeContext.value)
})

const resolvedBind = computed<ComponentBind>(() => {
  return resolveFormItemBind(props.config, runtimeContext.value)
})

const resolvedOptions = computed(() => {
  return resolveFormItemOptions(props.config, runtimeContext.value)
})

const resolvedOptionProps = computed(() => {
  return resolveFormItemOptionProps(props.config, runtimeContext.value)
})

/**
 * 传给 slot 的上下文。
 *
 * 除基础行信息外，也暴露行操作和校验快捷方法，让操作列可以保持声明式配置。
 */
const slotProps = computed<FormTableSlotContext>(() => ({
  row: props.row,
  index: props.index,
  rowCount: formTableContext.value.tableData.length,
  isFirstRow: props.index === 0,
  isLastRow: props.index === formTableContext.value.tableData.length - 1,
  fieldKey: props.config.key,
  propPath: props.propPath,
  value: getValueByPath(props.row, props.config.key),
  formData: formTableContext.value.formData,
  tableData: formTableContext.value.tableData,
  setValue,
  updateRow,
  removeCurrentRow: () => formTableActions.removeRow(props.index),
  copyCurrentRow: (patch?: Partial<FormTableRecord>) => formTableActions.copyRow(props.index, patch),
  insertBefore: (rowData?: Partial<FormTableRecord>) => formTableActions.insertRow(props.index, rowData),
  insertAfter: (rowData?: Partial<FormTableRecord>) => formTableActions.insertRow(props.index + 1, rowData),
  moveCurrentRow: (toIndex: number) => formTableActions.moveRow(props.index, toIndex),
  moveUp: () => formTableActions.moveRow(props.index, props.index - 1),
  moveDown: () => formTableActions.moveRow(props.index, props.index + 1),
  validateCurrentField: async () => await formTableActions.validateField(props.propPath),
  validateCurrentRow: async () => await formTableActions.validateRow(props.index),
  clearCurrentFieldValidate: () => formTableActions.clearValidate(props.propPath),
  clearCurrentRowValidate: () => formTableActions.clearRowValidate(props.index)
}))

/**
 * 合并全局 rules 和字段自身 rules。
 *
 * 全局 rules 支持通配路径，字段 rules 适合写局部、一次性的补充规则。
 */
const effectiveRules = computed(() => {
  const inheritedRules = resolveRulesForProp(formRules.value, props.propPath)
  const localRules = props.rules || []
  const mergedRules = [...inheritedRules, ...localRules]

  return mergedRules.length > 0 ? mergedRules : undefined
})

/**
 * 传给 ComponentWrapper 的渲染参数。
 *
 * 这里只传组件渲染需要的字段，避免把 layout/display/behavior 等结构配置
 * 继续下传到底层 Element UI 组件。
 */
const wrapperProps = computed(() => {
  const {
    key,
    type,
    component,
    rules,
    label,
    labelWidth,
    layout,
    display,
    behavior
  } = props.config

  return {
    type,
    fieldKey: key,
    row: props.row,
    rowIndex: props.index,
    customComponent: getFormItemCustomComponent(props.config),
    bind: resolvedBind.value,
    options: resolvedOptions.value,
    optionProps: resolvedOptionProps.value,
    listeners: getFormItemListeners(props.config),
    formatter: getFormItemFormatter(props.config),
    emptyText: getFormItemEmptyText(props.config)
  }
})

const isTooltipEnabled = computed(() => isFormItemTooltipEnabled(props.config))

/**
 * tooltip 在空值时不展示，避免出现空浮层。
 */
const hasContent = computed(() => {
  const value = getValueByPath(props.row, props.config.key)
  return value !== null && value !== undefined && value !== ''
})

/**
 * tooltip 展示内容复用 text 类型的展示解析逻辑。
 */
const tooltipContent = computed(() => {
  const displayValue = resolveDisplayValue(
    getValueByPath(props.row, props.config.key),
    resolvedOptions.value,
    resolvedOptionProps.value,
    getFormItemFormatter(props.config),
    getFormItemEmptyText(props.config),
    runtimeContext.value
  )

  return displayValue !== null && displayValue !== undefined ? String(displayValue) : ''
})
</script>
