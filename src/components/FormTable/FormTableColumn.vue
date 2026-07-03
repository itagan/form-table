<template>
  <el-table-column
    v-if="isNativeRenderColumn"
    :label="column.name"
    v-bind="columnAttrs"
  />

  <el-table-column
    v-else
    :label="column.name"
    v-bind="columnAttrs"
  >
    <template v-if="shouldRenderHeaderSlot" v-slot:header>
      <SlotRenderer
        v-if="headerSlotFn"
        :slot-fn="headerSlotFn"
        :slot-props="headerSlotProps"
      />
      <span v-else class="form-table-column-header">
        <span v-if="column.required" class="form-table-column-header__required">*</span>
        <span>{{ column.name }}</span>
      </span>
    </template>

    <template v-slot="scope">
      <FormTableRow
        v-for="(rowItem, rowIndex) in column.children"
        :key="getRowKey(rowItem, rowIndex)"
        :row="scope.row"
        :row-index="scope.$index"
        :row-config="rowItem"
      >
        <slot />
      </FormTableRow>
    </template>
  </el-table-column>
</template>

<script lang="ts" setup>
/**
 * FormTableColumn - 列渲染
 *
 * 对应 el-table-column，在每个表格单元格的 scoped slot 中
 * 按 column.children 渲染多行 FormTableRow 布局
 */
import { computed, defineComponent, h, inject, type ComputedRef, type PropType, useAttrs } from 'vue'
import FormTableRow from './FormTableRow.vue'
import type {
  ColumnConfig,
  FormTableBaseContext,
  FormTableHeaderSlotContext,
  FormTableSlotFn,
  FormTableSlots
} from './types'
import { FORM_TABLE_CONTEXT_KEY, FORM_TABLE_SLOTS_KEY } from './types'
import { extractColumnAttrs } from './utils/attrs'
import { createRuntimeContext, resolveDynamicValue } from './utils/dynamic'

const SlotRenderer = defineComponent({
  props: {
    slotFn: {
      type: Function as PropType<FormTableSlotFn<FormTableHeaderSlotContext> | null>,
      required: true
    },
    slotProps: {
      type: Object as PropType<FormTableHeaderSlotContext>,
      required: true
    }
  },
  setup(props) {
    return () => (
      props.slotFn
        ? h('span', { class: 'form-table-column-header' }, props.slotFn(props.slotProps))
        : null
    )
  }
})

interface Props {
  column: ColumnConfig
  columnIndex: number
}

const props = defineProps<Props>()
const attrs = useAttrs()
const formTableContext = inject<ComputedRef<FormTableBaseContext>>(
  FORM_TABLE_CONTEXT_KEY,
  computed(() => ({ formData: {}, tableData: [] }))
)
const parentSlots = inject<FormTableSlots>(FORM_TABLE_SLOTS_KEY, {})

const runtimeContext = computed(() => createRuntimeContext(formTableContext.value))

const columnAttrs = computed(() => ({
  ...extractColumnAttrs(attrs),
  ...(resolveDynamicValue(props.column.props, runtimeContext.value) || {})
}))

const nativeRenderColumnTypes = new Set(['index', 'selection', 'expand'])
const isNativeRenderColumn = computed(() => {
  return nativeRenderColumnTypes.has(columnAttrs.value.type)
})

const headerSlotName = computed(() => props.column.headerSlot)
const headerSlotFn = computed(() => {
  return headerSlotName.value ? parentSlots[headerSlotName.value] || null : null
})
const hasRenderHeader = computed(() => typeof columnAttrs.value.renderHeader === 'function')
const shouldRenderHeaderSlot = computed(() => {
  return !hasRenderHeader.value && (props.column.required === true || Boolean(headerSlotFn.value))
})

const headerSlotProps = computed<FormTableHeaderSlotContext>(() => ({
  column: props.column,
  columnIndex: props.columnIndex,
  label: props.column.name,
  required: props.column.required === true,
  formData: formTableContext.value.formData,
  tableData: formTableContext.value.tableData
}))

const getRowKey = (row: ColumnConfig['children'][number], index: number) => {
  const rowProps = resolveDynamicValue(row.props, runtimeContext.value) || {}
  return row.key || rowProps.key || index
}
</script>

<style lang="less" scoped>
.form-table-column-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &__required {
    color: #f56c6c;
    font-weight: 600;
  }
}
</style>
