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
        v-on="tableListeners"
        :data="props.tableData"
        v-loading="props.loading"
      >
        <FormTableColumn
          v-for="(column, columnIndex) in visibleColumns"
          :key="`${column.key || column.label || 'column'}:${columnIndex}`"
          :column="column"
          :column-index="columnIndex"
        />
      </el-table>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, provide, ref, useSlots } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import type {
  ColumnConfig,
  ComponentProps,
  FormTableElementFormRef,
  FormTableElementTableRef,
  FormTableFieldChangePayload,
  FormTableSlots,
  FormTableTableContext,
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

const formModel = computed(() => ({ tableData: props.tableData }))
const formTableContext = computed<FormTableTableContext>(() => createTableContext(props.tableData))

// 列显隐回调共享同一个表级上下文，避免为每列重复创建 tableContext。
const visibleColumns = computed(() => {
  return props.columns.filter((column) => resolveVisible(
    column.visible,
    createColumnContext(formTableContext.value, column)
  ))
})

// 同一同步调用链中的多次更新必须基于上一次已发出的结果继续计算。
// 微任务结束后重新以受控 props 为准，避免父组件未接收更新时长期保留内部状态。
let synchronousUpdateBase: TableRow[] | null = null
const synchronousRowIndexes = new Map<TableRow, number>()
let updateBaseResetPending = false

const scheduleUpdateBaseReset = () => {
  if (updateBaseResetPending) return
  updateBaseResetPending = true
  Promise.resolve().then(() => {
    synchronousUpdateBase = null
    synchronousRowIndexes.clear()
    updateBaseResetPending = false
  })
}

const getRowIdentity = (row: TableRow) => {
  const rowKey = props.tableProps?.rowKey
  if (typeof rowKey === 'function') return rowKey(row)
  if (typeof rowKey === 'string' && rowKey) return getValueByPath(row, rowKey)
  return undefined
}

/**
 * 通过 rowKey 或对象引用重新定位行，不信任渲染时下标。
 * rowKey 重复时拒绝更新，避免静默修改错误的数据行。
 */
const resolveUpdateRowIndex = (
  sourceTableData: TableRow[],
  targetRow: TableRow
) => {
  const rowKey = props.tableProps?.rowKey
  if (typeof rowKey === 'function' || (typeof rowKey === 'string' && rowKey)) {
    const identity = getRowIdentity(targetRow)
    if (identity === undefined || identity === null) return -1
    let matchedIndex = -1
    for (let index = 0; index < sourceTableData.length; index += 1) {
      if (!Object.is(getRowIdentity(sourceTableData[index]), identity)) continue
      if (matchedIndex >= 0) return -1
      matchedIndex = index
    }
    return matchedIndex
  }

  const referenceIndex = sourceTableData.indexOf(targetRow)
  if (referenceIndex >= 0) return referenceIndex
  // 仅跟踪本次同步更新链产生的行，不能用已过期的渲染下标匹配新数据。
  return synchronousRowIndexes.get(targetRow) ?? -1
}

/** 不修改受控 props，沿字段路径生成新行并集中派发变更事件。 */
const updateRow = (targetRow: TableRow, patch: Partial<TableRow>) => {
  const sourceTableData = synchronousUpdateBase || props.tableData
  const rowIndex = resolveUpdateRowIndex(sourceTableData, targetRow)
  if (rowIndex < 0) return
  const currentRow = sourceTableData[rowIndex]
  if (!currentRow) return

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
  synchronousRowIndexes.set(targetRow, rowIndex)
  synchronousRowIndexes.set(currentRow, rowIndex)
  synchronousRowIndexes.set(nextRow, rowIndex)
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
  setValue: (row, fieldKey, value) => updateRow(row, { [fieldKey]: value }),
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
