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

// Element UI 的功能列由 type 驱动，不应挂载普通字段的 scoped slot。
const isNativeColumn = computed(() => ['index', 'selection', 'expand'].includes(columnProps.value.type))

/** 根据配置名称查找实际存在的父级表头插槽。 */
const headerSlotFn = computed(() => props.column.headerSlot
  ? parentSlots[props.column.headerSlot] || null
  : null)

/** 仅在没有原生 renderHeader 且插槽真实存在时接管表头渲染。 */
const shouldRenderHeader = computed(() => {
  // 原生 renderHeader 的优先级高于 FormTable 的具名表头插槽。
  return typeof columnProps.value.renderHeader !== 'function' && Boolean(headerSlotFn.value)
})

/** 传给自定义表头插槽的完整列上下文。 */
const headerSlotProps = computed<FormTableHeaderSlotContext>(() => ({
  columnConfig: props.column,
  columnIndex: props.columnIndex,
  label: props.column.label,
  tableData: formTableContext.value.tableData
}))
</script>
