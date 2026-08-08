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

const props = defineProps<{
  column: ColumnConfig
  columnIndex: number
}>()

const formTableContext = inject<ComputedRef<FormTableTableContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ tableData: [] }))
)
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})
const columnContext = computed<FormTableColumnContext>(() => createColumnContext(
  formTableContext.value,
  props.column
))
const columnProps = computed(() => resolveDynamicValue(props.column.props, columnContext.value) || {})

// Element UI 的功能列由 type 驱动，不应挂载普通字段的 scoped slot。
const isNativeColumn = computed(() => ['index', 'selection', 'expand'].includes(columnProps.value.type))
const headerSlotFn = computed(() => props.column.headerSlot
  ? parentSlots[props.column.headerSlot] || null
  : null)
const shouldRenderHeader = computed(() => {
  // 原生 renderHeader 的优先级高于 FormTable 的具名表头插槽。
  return typeof columnProps.value.renderHeader !== 'function' && Boolean(headerSlotFn.value)
})
const headerSlotProps = computed<FormTableHeaderSlotContext>(() => ({
  columnConfig: props.column,
  columnIndex: props.columnIndex,
  label: props.column.label,
  tableData: formTableContext.value.tableData
}))
</script>
