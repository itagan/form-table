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
 * 数据流: tableData(props) → el-table 渲染 → 用户编辑 → dispatch('update:row') → emit('update:tableData')
 *
 * 层级结构: FormTable > FormTableColumn > FormTableRow > FormTableItem > ComponentWrapper
 *
 * 通过 provide 向子组件注入:
 * - customComponents: 自定义组件映射表
 * - dispatch: 统一事件分发函数，处理 update:row 等内部事件
 */
import { computed, provide, ref, useAttrs, useSlots, watch } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import { extractFormAttrs, extractTableAttrs } from './utils/attrs'
import { buildDefaultRow, createRuntimeContext, resolveDynamicValue, resolveVisible } from './utils/dynamic'
import { resolveFormItemVisible } from './utils/fieldConfig'
import { createInitialFieldChanges, resolveRowChange } from './utils/fieldChange'
import { applyRowPatch } from './utils/path'
import {
  insertTableRow,
  moveTableRow,
  normalizeInsertIndex,
  removeTableRow
} from './utils/rowActions'
import { getSchemaFieldProps, normalizeColumns } from './utils/schema'
import { createValidationController } from './utils/validation'
import type {
  ColumnConfig,
  CustomComponentConfig,
  DispatchFn,
  FormItemConfig,
  FormTableActions,
  FormTableBaseContext,
  FormTableFieldChangePayload,
  RowConfig,
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
  formData: Record<string, any>
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

const emit = defineEmits<{
  (e: 'update:tableData', data: TableRow[]): void
  (e: 'update:formData', data: Record<string, any>): void
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

// 从透传 attrs 中按白名单提取 el-form / el-table 可用属性
const formAttrs = computed(() => extractFormAttrs(attrs))
const tableAttrs = computed(() => extractTableAttrs(attrs))

// el-form 的 model 始终把外部 formData 和当前 tableData 合并，保证校验路径 tableData.* 可用。
const formModel = computed(() => ({
  ...props.formData,
  tableData: props.tableData
}))

// 子组件动态配置函数共用的基础上下文。
const formTableContext = computed<FormTableBaseContext>(() => ({
  formData: formModel.value,
  tableData: props.tableData
}))

// columns 归一化后提供字段索引，供联动、校验路径和行初始化复用。
const schema = computed(() => normalizeColumns(props.columns))
const visibleColumns = computed(() => {
  const context = createRuntimeContext(formTableContext.value)
  return schema.value.columns.filter((column) => resolveVisible(column.visible, context))
})

/**
 * 基于指定 tableData 创建临时上下文。
 *
 * 行增删改移过程中，真实 props 还没更新；需要用临时 tableData 计算显隐和校验字段。
 */
const createTableBaseContext = (tableData: TableRow[]): FormTableBaseContext => ({
  formData: {
    ...props.formData,
    tableData
  },
  tableData
})

/**
 * 同步外层 formData。
 *
 * FormTable 内部只拥有 tableData 的变更来源，其他 formData 字段保持外部原值。
 */
const emitFormDataUpdate = (tableData: TableRow[]) => {
  emit('update:formData', {
    ...props.formData,
    tableData
  })
}

/**
 * 提交 tableData 变化，并同步派发 formData 更新。
 */
const emitTableDataChange = (tableData: TableRow[]) => {
  emit('update:tableData', tableData)
  emitFormDataUpdate(tableData)
}

// 自定义组件映射表: { name → component }，供子组件 inject 使用
const customComponentsMap = computed(() => {
  const map: Record<string, any> = {}
  props.customComponents.forEach((item) => {
    map[item.name] = item.component
  })
  return map
})

const getColumnKey = (column: ColumnConfig, index: number) => {
  const columnProps = resolveDynamicValue(column.props, createRuntimeContext(formTableContext.value)) || {}
  return column.key || columnProps.columnKey || column.name || index
}

type EmitEventName =
  | 'update:tableData'
  | 'update:formData'
  | 'field-change'
  | 'row-add'
  | 'row-copy'
  | 'row-update'
  | 'row-move'
  | 'row-remove'
  | 'validate'

const getVisibleRowItems = (rowConfig: RowConfig, row: TableRow, rowIndex: number) => {
  return getVisibleRowItemsByContext(rowConfig, row, rowIndex, formTableContext.value)
}

/**
 * 获取某行配置下当前可见的字段项。
 *
 * 这个函数同时服务实时渲染和隐藏字段校验清理，所以允许传入临时 baseContext。
 */
const getVisibleRowItemsByContext = (
  rowConfig: RowConfig,
  row: TableRow,
  rowIndex: number,
  baseContext: FormTableBaseContext
) => {
  const rowContext = createRuntimeContext(baseContext, {
    row,
    index: rowIndex
  })

  if (!resolveVisible(rowConfig.visible, rowContext)) {
    return [] as FormItemConfig[]
  }

  return rowConfig.children.filter((item) => {
    return resolveFormItemVisible(item, createRuntimeContext(baseContext, {
      row,
      index: rowIndex,
      fieldKey: item.key
    }))
  })
}

const getFieldConfigByKey = (fieldKey: string) => {
  return schema.value.fieldMap.get(fieldKey)
}

const getConfiguredFieldKeys = () => {
  return schema.value.fieldKeys
}

const getAllRowFieldProps = (rowIndex: number, tableData: TableRow[] = props.tableData) => {
  if (!tableData[rowIndex]) {
    return []
  }

  return getSchemaFieldProps(schema.value, rowIndex)
}

/**
 * 提交单行 patch。
 *
 * 所有字段编辑、slot setValue、updateRow 最终都会进入这里；该函数负责：
 * - 解析路径 patch。
 * - 执行字段联动。
 * - 派发表格更新和 field-change。
 * - 调度隐藏字段校验清理。
 */
const commitRowChange = (rowIndex: number, patch: Partial<TableRow>) => {
  const currentRow = props.tableData[rowIndex]
  if (!currentRow) {
    return null
  }

  const resolved = resolveRowChange(
    {
      rowIndex,
      currentRow,
      tableData: props.tableData,
      formData: props.formData,
      getFieldConfig: getFieldConfigByKey
    },
    {
      initialPatch: patch
    }
  )

  if (resolved.fieldChanges.length === 0) {
    return resolved
  }

  const nextTableData = [...props.tableData]
  nextTableData[rowIndex] = resolved.nextRow
  emitTableDataChange(nextTableData)
  scheduleHiddenFieldValidationCleanup(nextTableData)
  resolved.fieldChanges.forEach((change) => {
    dispatch('field-change', change)
  })

  return resolved
}

const getRowFieldProps = (rowIndex: number) => {
  return getVisibleRowFieldProps(rowIndex, props.tableData)
}

/**
 * 获取指定行当前可见字段的校验路径。
 *
 * 与 getAllRowFieldProps 的差集用于清理隐藏字段上残留的校验错误。
 */
const getVisibleRowFieldProps = (rowIndex: number, tableData: TableRow[]) => {
  const row = tableData[rowIndex]
  if (!row) {
    return []
  }

  const fieldProps: string[] = []
  const baseContext = createTableBaseContext(tableData)
  const visibleColumnsForTable = schema.value.columns.filter((column) => {
    return resolveVisible(column.visible, createRuntimeContext(baseContext))
  })

  visibleColumnsForTable.forEach((column) => {
    column.children.forEach((rowConfig) => {
      getVisibleRowItemsByContext(rowConfig, row, rowIndex, baseContext).forEach((item) => {
        fieldProps.push(`tableData.${rowIndex}.${item.key}`)
      })
    })
  })

  return fieldProps
}

const {
  scheduleHiddenFieldValidationCleanup,
  validateFieldProps
} = createValidationController({
  formRef,
  getAllRowFieldProps,
  getVisibleRowFieldProps
})

/**
 * 插入行。
 *
 * 新行先根据可见字段补默认值，再触发初始化字段联动，确保新增行和用户编辑共用一套行为。
 */
const insertRow = (index: number, rowData?: Partial<TableRow>) => {
  const insertIndex = normalizeInsertIndex(index, props.tableData.length)
  const draftRow = buildDefaultRow(
    visibleColumns.value,
    formTableContext.value,
    insertIndex,
    rowData || {}
  )
  const insertResult = insertTableRow(props.tableData, insertIndex, draftRow)
  const { nextTableData } = insertResult
  const resolved = resolveRowChange(
    {
      rowIndex: insertIndex,
      currentRow: draftRow,
      tableData: props.tableData,
      formData: props.formData,
      getFieldConfig: getFieldConfigByKey
    },
    {
      tableData: nextTableData,
      initialChanges: createInitialFieldChanges(draftRow, getConfiguredFieldKeys())
    }
  )
  nextTableData[insertIndex] = resolved.nextRow
  emitTableDataChange(nextTableData)
  scheduleHiddenFieldValidationCleanup(nextTableData)
  dispatch('row-add', resolved.nextRow, insertIndex)
}

/**
 * 更新指定行。
 *
 * patch 支持嵌套路径 key，例如 `{ 'profile.city': '杭州' }`。
 */
const updateRow = (index: number, patch: Partial<TableRow>) => {
  if (!props.tableData[index]) {
    return
  }

  const resolved = commitRowChange(index, patch)
  if (!resolved || resolved.fieldChanges.length === 0) {
    return
  }

  dispatch('row-update', resolved.nextRow, index)
}

/**
 * 复制指定行。
 *
 * patch 会覆盖源行数据，并重新走默认值和字段联动，适合复制后微调部分字段。
 */
const copyRow = (index: number, patch?: Partial<TableRow>) => {
  const sourceRow = props.tableData[index]
  if (!sourceRow) {
    return
  }

  const copiedRow = buildDefaultRow(
    visibleColumns.value,
    formTableContext.value,
    index + 1,
    applyRowPatch(sourceRow, patch || {})
  )
  const { insertIndex, nextTableData } = insertTableRow(props.tableData, index + 1, copiedRow)
  const resolved = resolveRowChange(
    {
      rowIndex: insertIndex,
      currentRow: copiedRow,
      tableData: props.tableData,
      formData: props.formData,
      getFieldConfig: getFieldConfigByKey
    },
    {
      tableData: nextTableData,
      initialChanges: createInitialFieldChanges(copiedRow, getConfiguredFieldKeys())
    }
  )
  nextTableData[insertIndex] = resolved.nextRow
  emitTableDataChange(nextTableData)
  scheduleHiddenFieldValidationCleanup(nextTableData)
  dispatch('row-copy', resolved.nextRow, insertIndex)
}

/**
 * 删除指定行，并清理该行曾经注册过的校验状态。
 */
const removeRow = (index: number) => {
  const removeResult = removeTableRow(props.tableData, index)
  if (!removeResult) {
    return
  }

  formRef.value?.clearValidate(getAllRowFieldProps(index))
  const { removedRow, nextTableData } = removeResult
  emitTableDataChange(nextTableData)
  scheduleHiddenFieldValidationCleanup(nextTableData)
  dispatch('row-remove', removedRow, index)
}

/**
 * 移动行顺序。
 *
 * 移动后需要重新清理隐藏字段校验，因为校验路径里的 rowIndex 已经变化。
 */
const moveRow = (fromIndex: number, toIndex: number) => {
  const moveResult = moveTableRow(props.tableData, fromIndex, toIndex)
  if (!moveResult) {
    return
  }

  const { movedRow, normalizedToIndex, nextTableData } = moveResult
  emitTableDataChange(nextTableData)
  scheduleHiddenFieldValidationCleanup(nextTableData)
  dispatch('row-move', movedRow, fromIndex, normalizedToIndex)
}

// 提供给内部插槽和子组件的统一动作集合，也复用为部分 ref 方法实现。
const formTableActions: FormTableActions = {
  addRow: (rowData?: Partial<TableRow>) => {
    insertRow(props.tableData.length, rowData)
  },
  insertRow,
  copyRow,
  updateRow,
  removeRow,
  moveRow,
  getRow: (index: number) => props.tableData[index],
  getRowFieldProps,
  validateField: validateFieldProps,
  validateRow: async (index: number) => {
    return await validateFieldProps(getRowFieldProps(index))
  },
  clearValidate: (fieldProps?: string | string[]) => {
    formRef.value?.clearValidate(fieldProps)
  },
  clearRowValidate: (index: number) => {
    formRef.value?.clearValidate(getAllRowFieldProps(index))
  }
}

provide(FORM_TABLE_CUSTOM_COMPONENTS_KEY, customComponentsMap)
provide(FORM_TABLE_CONTEXT_KEY, formTableContext)
provide(FORM_TABLE_ACTIONS_KEY, formTableActions)
provide(FORM_TABLE_SLOTS_KEY, slots)
provide(FORM_TABLE_RULES_KEY, computed(() => props.rules))

// 表格数据、列配置或外部 formData 变化后，重新清理不可见字段的校验状态。
watch(
  [() => props.tableData, () => props.columns, () => props.formData],
  ([tableData]) => {
    scheduleHiddenFieldValidationCleanup(tableData)
  },
  { immediate: true }
)

/**
 * 统一事件分发器
 * - 'update:row': 单元格编辑时触发，按 rowIndex 更新对应行数据并 emit update:tableData
 * - 其他事件: 直接转发并同步派发 'event' 归档事件
 */
const dispatch = (type: EmitEventName | 'update:row' | 'update:row-data', ...args: any[]) => {
  if (type === 'update:row') {
    const [rowIndex, _row, fieldKey, value] = args
    commitRowChange(rowIndex, {
      [fieldKey]: value
    })
    return
  }

  if (type === 'update:row-data') {
    const [rowIndex, patch] = args
    commitRowChange(rowIndex, patch)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(emit as any)(type, ...args)
  emit('event', { type, args })
}

provide(FORM_TABLE_DISPATCH_KEY, dispatch)

// 暴露给业务侧 ref 调用的方法，保持和 Element UI Form 常用 API 风格接近。
defineExpose({
  validate: async (callback?: (valid: boolean, errors: any[]) => void) => {
    try {
      const valid = await formRef.value?.validate()
      const errors: any[] = []
      dispatch('validate', valid, errors)
      callback?.(valid, errors)
      return valid
    } catch (error) {
      const errors: any[] = Array.isArray(error) ? error : [error]
      dispatch('validate', false, errors)
      callback?.(false, errors)
      return false
    }
  },

  resetFields: () => {
    formRef.value?.resetFields()
  },

  validateField: validateFieldProps,

  validateRow: async (index: number) => {
    return await formTableActions.validateRow(index)
  },

  clearValidate: formTableActions.clearValidate,

  addRow: formTableActions.addRow,

  insertRow,

  copyRow,

  updateRow,

  moveRow,

  getRow: formTableActions.getRow,

  removeRow,

  getFormData: () => ({
    ...formModel.value
  }),

  setFormData: (data: Record<string, any>) => {
    if (data.tableData) {
      emitTableDataChange(data.tableData)
    }
    dispatch('update:formData', {
      ...data,
      tableData: data.tableData ?? props.tableData
    })
  }
})
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
