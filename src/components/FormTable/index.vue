<template>
  <div class="form-table-container">
    <el-form
      ref="formRef"
      :model="formModel"
      :rules="props.rules"
      v-bind="formAttrs"
    >
      <el-table
        ref="tableRef"
        :data="props.tableData"
        v-bind="tableAttrs"
        v-loading="props.loading"
        @select="handleTableSelect"
        @select-all="handleTableSelectAll"
        @selection-change="handleTableSelectionChange"
        @cell-mouse-enter="handleTableCellMouseEnter"
        @cell-mouse-leave="handleTableCellMouseLeave"
        @cell-click="handleTableCellClick"
        @cell-dblclick="handleTableCellDblclick"
        @row-click="handleTableRowClick"
        @row-contextmenu="handleTableRowContextmenu"
        @row-dblclick="handleTableRowDblclick"
        @header-click="handleTableHeaderClick"
        @header-contextmenu="handleTableHeaderContextmenu"
        @sort-change="handleTableSortChange"
        @filter-change="handleTableFilterChange"
        @current-change="handleTableCurrentChange"
        @header-dragend="handleTableHeaderDragend"
        @expand-change="handleTableExpandChange"
      >
        <FormTableColumn
          v-for="(column, columnIndex) in visibleColumns"
          :key="getColumnKey(column, columnIndex)"
          :column="column"
          :column-index="columnIndex"
        >
          <slot />
        </FormTableColumn>
      </el-table>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
/**
 * FormTable 主组件 - 表格内嵌表单
 *
 * 数据流: tableData(props) → el-table 渲染 → dispatch('update:row') → commitRowChange → emit
 * 层级结构: FormTable > FormTableColumn > FormTableRow > FormTableItem > ComponentWrapper
 *
 * 入口组件只负责模板组装、provide 和 ref API 汇总；模型、schema、事件、行操作和校验
 * 分别收口到 composables 中，保持外部 API 不变。
 */
import { computed, provide, ref, useAttrs, useSlots } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import { useFormTableEvents } from './composables/useFormTableEvents'
import { useFormTableExpose } from './composables/useFormTableExpose'
import { useFormTableModel } from './composables/useFormTableModel'
import { useFormTableRows } from './composables/useFormTableRows'
import { useFormTableSchema } from './composables/useFormTableSchema'
import { useFormTableValidation } from './composables/useFormTableValidation'
import { extractFormAttrs, extractTableAttrs } from './utils/attrs'
import { archiveFormTableEventArgs } from './utils/eventArchive'
import type {
  ColumnConfig,
  CustomComponentConfig,
  FormTableEmitFn,
  FormTableElementFormRef,
  FormTableElementTableRef,
  FormTableArchivedEventName,
  FormTableEventPayload,
  FormTableFieldChangePayload,
  FormTableRecord,
  FormTableSlots,
  FormTableValidationErrors,
  ValidationRule,
  TableRow
} from './types'
import {
  FORM_TABLE_ACTIONS_KEY,
  FORM_TABLE_CUSTOM_COMPONENTS_KEY,
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_DISPATCH_KEY,
  FORM_TABLE_RULES_KEY,
  FORM_TABLE_SLOTS_KEY
} from './types'

const attrs = useAttrs()
const slots = useSlots()

const props = withDefaults(defineProps<{
  tableData: TableRow[]
  columns: ColumnConfig[]
  rules: Record<string, ValidationRule[]>
  formData: FormTableRecord
  customComponents?: CustomComponentConfig[]
  loading?: boolean
}>(), {
  tableData: () => [],
  columns: () => [],
  rules: () => ({}),
  formData: () => ({}),
  customComponents: () => [],
  loading: false
})

// Vue 2.7 的 SFC 编译器要求 defineEmits 使用本地 call signatures；
// 内部 composables 仍通过 FormTableEmitFn 复用 types.ts 中的事件参数映射。
const emit = defineEmits<{
  (e: 'update:tableData', data: TableRow[]): void
  (e: 'update:formData', data: FormTableRecord): void
  (e: 'field-change', payload: FormTableFieldChangePayload): void
  (e: 'row-add', row: TableRow, index: number): void
  (e: 'row-copy', row: TableRow, index: number): void
  (e: 'row-update', row: TableRow, index: number): void
  (e: 'row-move', row: TableRow, fromIndex: number, toIndex: number): void
  (e: 'row-remove', row: TableRow, index: number): void
  (e: 'validate', valid: boolean, errors: FormTableValidationErrors): void
  (e: 'select', selection: TableRow[], row: TableRow): void
  (e: 'select-all', selection: TableRow[]): void
  (e: 'selection-change', selection: TableRow[]): void
  (e: 'cell-mouse-enter', row: TableRow, column: any, cell: HTMLElement, event: Event): void
  (e: 'cell-mouse-leave', row: TableRow, column: any, cell: HTMLElement, event: Event): void
  (e: 'cell-click', row: TableRow, column: any, cell: HTMLElement, event: Event): void
  (e: 'cell-dblclick', row: TableRow, column: any, cell: HTMLElement, event: Event): void
  (e: 'row-click', row: TableRow, column: any, event: Event): void
  (e: 'row-contextmenu', row: TableRow, column: any, event: Event): void
  (e: 'row-dblclick', row: TableRow, column: any, event: Event): void
  (e: 'header-click', column: any, event: Event): void
  (e: 'header-contextmenu', column: any, event: Event): void
  (e: 'sort-change', payload: any): void
  (e: 'filter-change', filters: any): void
  (e: 'current-change', currentRow: TableRow | null, oldCurrentRow: TableRow | null): void
  (e: 'header-dragend', newWidth: number, oldWidth: number, column: any, event: Event): void
  (e: 'expand-change', row: TableRow, expandedRows: TableRow[]): void
  (e: 'event', payload: FormTableEventPayload): void
}>()

const formRef = ref<FormTableElementFormRef | null>(null)
const tableRef = ref<FormTableElementTableRef | null>(null)
const formAttrs = computed(() => extractFormAttrs(attrs))
const tableAttrs = computed(() => extractTableAttrs(attrs))

const emitTableEvent = (
  type: FormTableArchivedEventName,
  ...args: any[]
) => {
  ;(emit as any)(type, ...args)
  emit('event', { type, args: archiveFormTableEventArgs(type, args) })
}

const handleTableSelect = (selection: TableRow[], row: TableRow) => {
  emitTableEvent('select', selection, row)
}

const handleTableSelectAll = (selection: TableRow[]) => {
  emitTableEvent('select-all', selection)
}

const handleTableSelectionChange = (selection: TableRow[]) => {
  emitTableEvent('selection-change', selection)
}

const handleTableCellMouseEnter = (
  row: TableRow,
  column: any,
  cell: HTMLElement,
  event: Event
) => {
  emitTableEvent('cell-mouse-enter', row, column, cell, event)
}

const handleTableCellMouseLeave = (
  row: TableRow,
  column: any,
  cell: HTMLElement,
  event: Event
) => {
  emitTableEvent('cell-mouse-leave', row, column, cell, event)
}

const handleTableCellClick = (
  row: TableRow,
  column: any,
  cell: HTMLElement,
  event: Event
) => {
  emitTableEvent('cell-click', row, column, cell, event)
}

const handleTableCellDblclick = (
  row: TableRow,
  column: any,
  cell: HTMLElement,
  event: Event
) => {
  emitTableEvent('cell-dblclick', row, column, cell, event)
}

const handleTableRowClick = (row: TableRow, column: any, event: Event) => {
  emitTableEvent('row-click', row, column, event)
}

const handleTableRowContextmenu = (row: TableRow, column: any, event: Event) => {
  emitTableEvent('row-contextmenu', row, column, event)
}

const handleTableRowDblclick = (row: TableRow, column: any, event: Event) => {
  emitTableEvent('row-dblclick', row, column, event)
}

const handleTableHeaderClick = (column: any, event: Event) => {
  emitTableEvent('header-click', column, event)
}

const handleTableHeaderContextmenu = (column: any, event: Event) => {
  emitTableEvent('header-contextmenu', column, event)
}

const handleTableSortChange = (payload: any) => {
  emitTableEvent('sort-change', payload)
}

const handleTableFilterChange = (filters: any) => {
  emitTableEvent('filter-change', filters)
}

const handleTableCurrentChange = (
  currentRow: TableRow | null,
  oldCurrentRow: TableRow | null
) => {
  emitTableEvent('current-change', currentRow, oldCurrentRow)
}

const handleTableHeaderDragend = (
  newWidth: number,
  oldWidth: number,
  column: any,
  event: Event
) => {
  emitTableEvent('header-dragend', newWidth, oldWidth, column, event)
}

const handleTableExpandChange = (row: TableRow, expandedRows: TableRow[]) => {
  emitTableEvent('expand-change', row, expandedRows)
}

const {
  formModel,
  formTableContext,
  createTableBaseContext,
  emitTableDataChange,
  customComponentsMap
} = useFormTableModel({
  props,
  emitTableData: (tableData) => emit('update:tableData', tableData),
  emitFormData: (formData) => emit('update:formData', formData)
})

const {
  visibleColumns,
  getColumnKey,
  getFieldConfigByKey,
  getConfiguredFieldKeys,
  getAllRowFieldProps,
  getVisibleRowFieldProps
} = useFormTableSchema({
  props,
  formTableContext,
  createTableBaseContext
})

const {
  dispatch,
  emitBusinessEvent,
  setInternalEventHandlers
} = useFormTableEvents(emit as FormTableEmitFn)

const {
  scheduleHiddenFieldValidationCleanup,
  validateFieldProps
} = useFormTableValidation({
  props,
  formRef,
  getAllRowFieldProps,
  getVisibleRowFieldProps
})

const {
  commitRowChange,
  insertRow,
  updateRow,
  copyRow,
  removeRow,
  moveRow,
  formTableActions
} = useFormTableRows({
  props,
  formRef,
  formTableContext,
  visibleColumns,
  getFieldConfigByKey,
  getConfiguredFieldKeys,
  getAllRowFieldProps,
  getVisibleRowFieldProps,
  validateFieldProps,
  emitTableDataChange,
  scheduleHiddenFieldValidationCleanup,
  emitBusinessEvent
})

setInternalEventHandlers({
  updateRowField: (rowIndex, fieldKey, value) => {
    commitRowChange(rowIndex, {
      [fieldKey]: value
    })
  },
  updateRowData: (rowIndex, patch) => {
    commitRowChange(rowIndex, patch)
  }
})

provide(FORM_TABLE_CUSTOM_COMPONENTS_KEY, customComponentsMap)
provide(FORM_TABLE_CONTEXT_KEY, formTableContext)
provide(FORM_TABLE_ACTIONS_KEY, formTableActions)
provide(FORM_TABLE_SLOTS_KEY, slots as FormTableSlots)
provide(FORM_TABLE_RULES_KEY, computed(() => props.rules))
provide(FORM_TABLE_DISPATCH_KEY, dispatch)

// 暴露给业务侧 ref 调用的方法，保持和 Element UI Form 常用 API 风格接近。
defineExpose(useFormTableExpose({
  props,
  formRef,
  tableRef,
  formModel,
  formTableActions,
  validateFieldProps,
  emitTableDataChange,
  emitBusinessEvent,
  insertRow,
  copyRow,
  updateRow,
  moveRow,
  removeRow
}))
</script>

<style lang="less" scoped>
.form-table-container {
  :deep(.el-table) {
    .el-table__body-wrapper {
      .el-table__row {
        .el-table__cell {
          padding: 8px 0;

          .el-form-item {
            margin-bottom: 0;

            .el-form-item__content {
              line-height: 1;
            }
          }
        }
      }
    }
  }
}
</style>
