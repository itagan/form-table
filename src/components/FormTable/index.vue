<template>
  <div class="form-table-container">
    <el-form
      ref="formRef"
      :model="formModel"
      :rules="props.rules"
      v-bind="formAttrs"
    >
      <el-table
        :data="props.tableData"
        v-bind="tableAttrs"
        v-loading="props.loading"
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
import type {
  ColumnConfig,
  CustomComponentConfig,
  FormTableEmitFn,
  FormTableFieldChangePayload,
  FormTableRecord,
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
  (e: 'validate', valid: boolean, errors: any[]): void
  (e: 'event', payload: { type: string; args: any[] }): void
}>()

const formRef = ref<any>(null)
const formAttrs = computed(() => extractFormAttrs(attrs))
const tableAttrs = computed(() => extractTableAttrs(attrs))

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
provide(FORM_TABLE_SLOTS_KEY, slots)
provide(FORM_TABLE_RULES_KEY, computed(() => props.rules))
provide(FORM_TABLE_DISPATCH_KEY, dispatch)

// 暴露给业务侧 ref 调用的方法，保持和 Element UI Form 常用 API 风格接近。
defineExpose(useFormTableExpose({
  props,
  formRef,
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
