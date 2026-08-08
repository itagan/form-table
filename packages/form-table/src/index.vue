<template>
  <div class="form-table-container">
    <el-form
      ref="formRef"
      v-bind="props.formProps"
      :model="formModel"
    >
      <el-table
        ref="tableRef"
        v-bind="props.tableProps"
        v-on="$listeners"
        :data="props.tableData"
        v-loading="props.loading"
      >
        <FormTableColumn
          v-for="(column, columnIndex) in visibleColumns"
          :key="column.key || column.label || columnIndex"
          :column="column"
          :column-index="columnIndex"
        />
      </el-table>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide, ref, useSlots } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import type {
  ColumnConfig,
  ComponentProps,
  FormTableElementFormRef,
  FormTableElementTableRef,
  FormTableFieldChangePayload,
  FormTableSlots,
  FormTableUpdateApi,
  FormTableValue,
  TableRow
} from './types'
import {
  FORM_TABLE_CONTEXT_KEY,
  FORM_TABLE_SLOTS_KEY,
  FORM_TABLE_UPDATE_KEY
} from './types'
import { createColumnContext, createTableContext, resolveVisible } from './utils/dynamic'
import { getValueByPath, setValueByPath } from './utils/path'

const props = withDefaults(defineProps<{
  tableData: TableRow[]
  columns: ColumnConfig[]
  formProps?: ComponentProps
  tableProps?: ComponentProps
  loading?: boolean
}>(), {
  tableData: () => [],
  columns: () => [],
  formProps: () => ({}),
  tableProps: () => ({}),
  loading: false
})

const emit = defineEmits<{
  (event: 'update:tableData', data: TableRow[]): void
  (event: 'field-change', payload: FormTableFieldChangePayload): void
}>()

const formRef = ref<FormTableElementFormRef | null>(null)
const tableRef = ref<FormTableElementTableRef | null>(null)
const slots = useSlots()

const formModel = computed(() => ({ tableData: props.tableData }))
const formTableContext = computed(() => ({
  tableData: props.tableData
}))

const visibleColumns = computed(() => {
  const tableContext = createTableContext(props.tableData)
  return props.columns.filter((column) => resolveVisible(
    column.visible,
    createColumnContext(tableContext, column)
  ))
})

// 同一同步调用链中的多次更新必须基于上一次已发出的结果继续计算。
// 微任务结束后重新以受控 props 为准，避免父组件未接收更新时长期保留内部状态。
let synchronousUpdateBase: TableRow[] | null = null
let updateBaseResetPending = false

const scheduleUpdateBaseReset = () => {
  if (updateBaseResetPending) return
  updateBaseResetPending = true
  Promise.resolve().then(() => {
    synchronousUpdateBase = null
    updateBaseResetPending = false
  })
}

const updateRow = (rowIndex: number, patch: Partial<TableRow>) => {
  const sourceTableData = synchronousUpdateBase || props.tableData
  const currentRow = sourceTableData[rowIndex]
  if (!currentRow) {
    return
  }

  let nextRow = currentRow
  const changes: Array<{
    fieldKey: string
    value: FormTableValue
    previousValue: FormTableValue
  }> = []

  Object.keys(patch).forEach((fieldKey) => {
    const value = patch[fieldKey]
    const previousValue = getValueByPath(nextRow, fieldKey)
    if (Object.is(previousValue, value)) {
      return
    }

    nextRow = setValueByPath(nextRow, fieldKey, value)
    changes.push({ fieldKey, value, previousValue })
  })

  if (changes.length === 0) {
    return
  }

  const nextTableData = [...sourceTableData]
  nextTableData[rowIndex] = nextRow
  synchronousUpdateBase = nextTableData
  scheduleUpdateBaseReset()
  emit('update:tableData', nextTableData)

  changes.forEach((change) => {
    emit('field-change', {
      row: nextRow,
      index: rowIndex,
      ...change
    })
  })
}

const updateApi: FormTableUpdateApi = {
  setValue: (rowIndex, fieldKey, value) => updateRow(rowIndex, { [fieldKey]: value }),
  updateRow
}

provide(FORM_TABLE_CONTEXT_KEY, formTableContext)
provide(FORM_TABLE_UPDATE_KEY, updateApi)
provide(FORM_TABLE_SLOTS_KEY, slots as FormTableSlots)

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
