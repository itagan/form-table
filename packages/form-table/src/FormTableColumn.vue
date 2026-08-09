<template>
  <el-table-column
    v-if="isNativeColumn"
    :label="column.label"
    v-bind="columnProps"
  />

  <el-table-column
    v-else
    :label="column.label"
    v-bind="columnProps"
  >
    <template v-if="shouldRenderHeader" v-slot:header>
      <SlotRenderer
        v-if="headerSlotFn"
        :slot-fn="headerSlotFn"
        :slot-props="headerSlotProps"
      />
      <span
        v-else
        class="form-table-column-header"
        v-bind="resolvedHeaderProps"
      >{{ column.label }}</span>
    </template>

    <template v-slot="scope">
      <FormTableRow
        v-for="(rowConfig, rowIndex) in column.children"
        :key="rowConfig.key || rowIndex"
        :row="scope.row"
        :row-index="scope.$index"
        :column-context="columnContext"
        :row-config="rowConfig"
      />
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
import { computed, inject, type ComputedRef } from 'vue'
import FormTableRow from './FormTableRow.vue'
import SlotRenderer from './SlotRenderer'
import type {
  ColumnConfig,
  FormTableColumnContext,
  FormTableTableContext,
  FormTableHeaderSlotContext,
  FormTableSlots
} from './types'
import { FORM_TABLE_CONTEXT_KEY, FORM_TABLE_SLOTS_KEY } from './types'
import { createColumnContext, resolveDynamicValue } from './utils/dynamic'

/** 当前列配置及其在可见列集合中的下标。 */
const props = defineProps<{
  column: ColumnConfig
  columnIndex: number
}>()

/** 根组件提供的表级响应式数据，是列动态回调的基础上下文。 */
const formTableContext = inject<ComputedRef<FormTableTableContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ tableData: [] }))
)

/** 父组件具名插槽集合，用于解析 column.headerSlot。 */
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})

/** 合并表级数据和当前列配置，供列属性、表头和下级行共同复用。 */
const columnContext = computed<FormTableColumnContext>(() => createColumnContext(
  formTableContext.value,
  props.column
))

/** 解析静态或函数形式的 el-table-column 透传属性。 */
const columnProps = computed(() => resolveDynamicValue(props.column.props, columnContext.value) || {})

/**
 * 解析默认表头文本节点属性，并将 headerHint 映射为原生 title。
 * 未配置 headerHint 时保留 headerProps 的底层透传结果。
 */
const resolvedHeaderProps = computed(() => {
  const headerProps = resolveDynamicValue(props.column.headerProps, columnContext.value) || {}
  if (!Object.prototype.hasOwnProperty.call(props.column, 'headerHint')) return headerProps

  const otherHeaderProps = { ...headerProps }
  delete otherHeaderProps.title
  const headerHint = resolveDynamicValue(props.column.headerHint, columnContext.value)
  return {
    ...otherHeaderProps,
    ...(headerHint === undefined || headerHint === null ? {} : { title: headerHint })
  }
})

// Element UI 的功能列由 type 驱动，不应挂载普通字段的 scoped slot。
const isNativeColumn = computed(() => ['index', 'selection', 'expand'].includes(columnProps.value.type))

/** 根据配置名称查找实际存在的父级表头插槽。 */
const headerSlotFn = computed(() => props.column.headerSlot
  ? parentSlots[props.column.headerSlot] || null
  : null)

/** 仅在没有原生 renderHeader 且确有自定义内容或属性时接管普通列表头。 */
const shouldRenderHeader = computed(() => {
  // 原生 renderHeader 的优先级高于 FormTable 的具名表头插槽。
  return typeof columnProps.value.renderHeader !== 'function'
    && (Boolean(headerSlotFn.value) || Object.keys(resolvedHeaderProps.value).length > 0)
})

/** 传给自定义表头插槽的完整列上下文。 */
const headerSlotProps = computed<FormTableHeaderSlotContext>(() => ({
  columnConfig: props.column,
  columnIndex: props.columnIndex,
  label: props.column.label,
  tableData: formTableContext.value.tableData
}))
</script>
