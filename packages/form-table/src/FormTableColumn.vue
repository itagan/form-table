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
        :column-config="column"
        :row-config="rowConfig"
      />
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
import { computed, defineComponent, h, inject, type ComputedRef, type PropType } from 'vue'
import FormTableRow from './FormTableRow.vue'
import type {
  ColumnConfig,
  FormTableColumnContext,
  FormTableTableContext,
  FormTableHeaderSlotContext,
  FormTableSlotFn,
  FormTableSlots
} from './types'
import { FORM_TABLE_CONTEXT_KEY, FORM_TABLE_SLOTS_KEY } from './types'
import { createColumnContext, resolveDynamicValue } from './utils/dynamic'

const SlotRenderer = defineComponent({
  props: {
    slotFn: { type: Function as PropType<FormTableSlotFn>, required: true },
    slotProps: { type: Object as PropType<FormTableHeaderSlotContext>, required: true }
  },
  setup(props) {
    return () => h('span', { class: 'form-table-column-header' }, props.slotFn(props.slotProps))
  }
})

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
const isNativeColumn = computed(() => ['index', 'selection', 'expand'].includes(columnProps.value.type))
const headerSlotFn = computed(() => props.column.headerSlot
  ? parentSlots[props.column.headerSlot] || null
  : null)
const shouldRenderHeader = computed(() => {
  return typeof columnProps.value.renderHeader !== 'function' && Boolean(headerSlotFn.value)
})
const headerSlotProps = computed<FormTableHeaderSlotContext>(() => ({
  columnConfig: props.column,
  columnIndex: props.columnIndex,
  label: props.column.label,
  tableData: formTableContext.value.tableData
}))
</script>

<style lang="less" scoped>
.form-table-column-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
