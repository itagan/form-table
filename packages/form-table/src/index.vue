<template>
  <div
    ref="containerRef"
    class="form-table-container"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <el-form
      ref="formRef"
      v-bind="props.formProps"
      :model="formModel"
    >
      <el-table
        ref="tableRef"
        v-bind="props.tableProps"
        v-on="tableListeners"
        :data="props.tableData"
        v-loading="props.loading"
      >
        <FormTableColumn
          v-for="(entry, columnIndex) in visibleColumns"
          :key="entry.renderKey"
          :column="entry.column"
          :column-index="columnIndex"
        />
      </el-table>
    </el-form>
    <el-tooltip
      v-if="isTooltipHintMode"
      ref="hintTooltipRef"
      v-bind="resolvedHintTooltipProps"
      :content="hintTooltipContent"
      :enterable="false"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

/** Vue 2 根组件 v-model 复用现有 tableData/update:tableData 受控协议。 */
export default defineComponent({
  name: 'FormTable',
  model: {
    prop: 'tableData',
    event: 'update:tableData'
  }
})
</script>

<script lang="ts" setup>
import { computed, getCurrentInstance, provide, ref, useSlots } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import type {
  ColumnConfig,
  ComponentProps,
  FormTableElementFormRef,
  FormTableElementTableRef,
  FormTableFieldChangePayload,
  FormTableHintMode,
  FormTableHintModeContext,
  FormTableSlots,
  FormTableTableContext,
  FormTableUpdateApi,
  FormTableValue,
  TableRow
} from './types'
import {
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_HINT_MODE_KEY,
  FORM_TABLE_SLOTS_KEY,
  FORM_TABLE_UPDATE_KEY
} from './types'
import { useColumnIdentity } from './composables/useColumnIdentity'
import { useControlledTableUpdate } from './composables/useControlledTableUpdate'
import {
  useFormTableHintTooltip
} from './composables/useFormTableHintTooltip'
import type { FormTableHintTooltipRef } from './composables/useFormTableHintTooltip'
import { createTableContext } from './utils/dynamic'

/** FormTable 对外接收的受控数据、列配置以及 Element UI 透传属性。 */
const props = withDefaults(defineProps<{
  /** 根组件 v-model 对应 prop；更新统一发出 update:tableData。 */
  tableData: TableRow[]
  columns: ColumnConfig[]
  formProps?: ComponentProps
  tableProps?: ComponentProps
  hintMode?: FormTableHintMode
  hintTooltipProps?: ComponentProps
  loading?: boolean
}>(), {
  tableData: () => [],
  columns: () => [],
  formProps: () => ({}),
  tableProps: () => ({}),
  hintMode: 'title',
  hintTooltipProps: () => ({}),
  loading: false
})

/** 数据更新和字段粒度变更是组件自身负责派发的两个业务事件。 */
const emit = defineEmits<{
  (event: 'update:tableData', data: TableRow[]): void
  (event: 'field-change', payload: FormTableFieldChangePayload): void
}>()

/** 暴露给父组件的 Element UI 原始实例引用。 */
const formRef = ref<FormTableElementFormRef | null>(null)
const tableRef = ref<FormTableElementTableRef | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const hintTooltipRef = ref<FormTableHintTooltipRef | null>(null)
const hintTooltipContent = ref('')

/** hintMode 是整个表格唯一的提示展示策略。 */
const hintMode = computed<FormTableHintMode>(() => props.hintMode)
const isTooltipHintMode = computed(() => hintMode.value === 'tooltip')

/** Tooltip 的内容、引用和显隐由内部统一控制，不允许透传属性改变。 */
const resolvedHintTooltipProps = computed(() => {
  const managedProps = new Set(['content', 'reference', 'popper', 'manual', 'value', 'enterable'])
  const passthrough = Object.keys(props.hintTooltipProps).reduce<ComponentProps>((result, key) => {
    if (!managedProps.has(key)) result[key] = props.hintTooltipProps[key]
    return result
  }, {})
  const customPopperClass = typeof passthrough.popperClass === 'string'
    ? passthrough.popperClass
    : ''
  return {
    placement: 'top',
    effect: 'dark',
    ...passthrough,
    popperClass: ['form-table-hint-tooltip', customPopperClass].filter(Boolean).join(' ')
  }
})

const {
  handleMouseOver,
  handleMouseOut,
  handleFocusIn,
  handleFocusOut
} = useFormTableHintTooltip({
  enabled: isTooltipHintMode,
  containerRef,
  tooltipRef: hintTooltipRef,
  content: hintTooltipContent
})

/** 保存父组件插槽和 Vue 2 组件实例，供后代组件及事件透传使用。 */
const slots = useSlots()
const instance = getCurrentInstance()

// 组件自身事件在本层触发，其余监听器原样交给 el-table。
const tableListeners = computed(() => {
  const listeners = (instance?.proxy as any)?.$listeners || {}
  return Object.keys(listeners).reduce<Record<string, (...args: unknown[]) => void>>((result, name) => {
    if (name !== 'update:tableData' && name !== 'field-change') {
      result[name] = listeners[name]
    }
    return result
  }, {})
})

/** el-form 的校验模型；字段 prop 均以 tableData.{rowIndex}.{fieldKey} 开头。 */
const formModel = computed(() => ({ tableData: props.tableData }))

/** 向列、行、字段组件提供的响应式表级上下文。 */
const formTableContext: FormTableTableContext = createTableContext(() => props.tableData)

const { visibleColumns } = useColumnIdentity(() => props.columns, formTableContext)

/** 通过独立受控更新模块统一不可变写回、稳定行定位和同步组合。 */
const updateApi: FormTableUpdateApi = useControlledTableUpdate({
  getTableData: () => props.tableData,
  getRowKey: () => props.tableProps?.rowKey,
  emitUpdate: data => emit('update:tableData', data),
  emitFieldChange: payload => emit('field-change', payload)
})

/** 后代组件共享表数据、更新入口和父级插槽，避免逐层透传无关参数。 */
provide(FORM_TABLE_CONTEXT_KEY, formTableContext)
provide(FORM_TABLE_UPDATE_KEY, updateApi)
provide(FORM_TABLE_SLOTS_KEY, slots as FormTableSlots)
provide(FORM_TABLE_HINT_MODE_KEY, hintMode as FormTableHintModeContext)

/**
 * 将 Element UI 的 Promise/callback 两种校验方式统一为 Promise<boolean>，
 * 校验失败时保留 fields 并传给可选回调。
 */
const validate = async (callback?: (valid: boolean, fields?: FormTableValue) => void) => {
  try {
    const valid = Boolean(await formRef.value?.validate?.())
    callback?.(valid)
    return valid
  } catch (fields) {
    callback?.(false, fields)
    return false
  }
}

/** 对外只暴露稳定方法，避免父组件依赖 setup 内部状态。 */
defineExpose({
  validate,
  resetFields: () => formRef.value?.resetFields?.(),
  clearValidate: (fieldProps?: string | string[]) => formRef.value?.clearValidate?.(fieldProps),
  getFormRef: () => formRef.value,
  getTableRef: () => tableRef.value
})
</script>

<style lang="less" scoped>
.form-table-container {
  :deep(.el-table__cell .el-form-item) {
    margin-bottom: 0;
  }
}
</style>
