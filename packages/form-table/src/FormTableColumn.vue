<template>
  <el-table-column
    v-if="isNativeColumn"
    :label="column.name"
    v-bind="columnProps"
  />

  <el-table-column
    v-else
    :label="column.name"
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
  FormTableTableContext,
  FormTableHeaderSlotContext,
  FormTableSlotFn,
  FormTableSlots
} from './types'
import { FORM_TABLE_CONTEXT_KEY, FORM_TABLE_SLOTS_KEY } from './types'
import { resolveDynamicValue } from './utils/dynamic'

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
const columnProps = computed(() => resolveDynamicValue(props.column.props, formTableContext.value) || {})
const isNativeColumn = computed(() => ['index', 'selection', 'expand'].includes(columnProps.value.type))
const headerSlotFn = computed(() => props.column.headerSlot
  ? parentSlots[props.column.headerSlot] || null
  : null)
const shouldRenderHeader = computed(() => {
  return typeof columnProps.value.renderHeader !== 'function' && Boolean(headerSlotFn.value)
})
const headerSlotProps = computed<FormTableHeaderSlotContext>(() => ({
  column: props.column,
  columnIndex: props.columnIndex,
  label: props.column.name,
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
