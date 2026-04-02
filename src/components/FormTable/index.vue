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
          v-for="(column, columnIndex) in props.columns"
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
import { computed, provide, ref, useAttrs, useSlots } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import { extractFormAttrs, extractTableAttrs } from './utils/attrs'
import type {
  ColumnConfig,
  CustomComponentConfig,
  DispatchFn,
  ValidationRule,
  TableRow
} from './types'
import {
  FORM_TABLE_CUSTOM_COMPONENTS_KEY,
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
  (e: 'row-add', row: TableRow, index: number): void
  (e: 'row-remove', row: TableRow, index: number): void
  (e: 'validate', valid: boolean, errors: any[]): void
  (e: 'event', payload: { type: string; args: any[] }): void
}>()

const formRef = ref<any>(null)

// 从透传 attrs 中按白名单提取 el-form / el-table 可用属性
const formAttrs = computed(() => extractFormAttrs(attrs))
const tableAttrs = computed(() => extractTableAttrs(attrs))
const formModel = computed(() => ({
  ...props.formData,
  tableData: props.tableData
}))

const emitFormDataUpdate = (tableData: TableRow[]) => {
  emit('update:formData', {
    ...props.formData,
    tableData
  })
}

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

provide(FORM_TABLE_CUSTOM_COMPONENTS_KEY, customComponentsMap)
provide(FORM_TABLE_SLOTS_KEY, slots)
provide(FORM_TABLE_RULES_KEY, computed(() => props.rules))

const getColumnKey = (column: ColumnConfig, index: number) => {
  return column.key || column.props?.columnKey || column.name || index
}

type EmitEventName = 'update:tableData' | 'update:formData' | 'row-add' | 'row-remove' | 'validate'

/**
 * 统一事件分发器
 * - 'update:row': 单元格编辑时触发，按 rowIndex 更新对应行数据并 emit update:tableData
 * - 其他事件: 直接转发并同步派发 'event' 归档事件
 */
const dispatch = (type: EmitEventName | 'update:row', ...args: any[]) => {
  if (type === 'update:row') {
    const [rowIndex, , fieldKey, value] = args
    const nextTableData = [...props.tableData]
    nextTableData[rowIndex] = { ...nextTableData[rowIndex], [fieldKey]: value }
    emitTableDataChange(nextTableData)
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(emit as any)(type, ...args)
  emit('event', { type, args })
}

provide(FORM_TABLE_DISPATCH_KEY, dispatch)

// 暴露给 ref 调用的方法
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

  clearValidate: (fieldProps?: string | string[]) => {
    formRef.value?.clearValidate(fieldProps)
  },

  addRow: (rowData?: Partial<TableRow>) => {
    const newRow = { ...rowData }
    const nextTableData = [...props.tableData, newRow]
    emitTableDataChange(nextTableData)
    dispatch('row-add', newRow, nextTableData.length - 1)
  },

  removeRow: (index: number) => {
    const nextTableData = [...props.tableData]
    const removedRow = nextTableData.splice(index, 1)[0]
    emitTableDataChange(nextTableData)
    dispatch('row-remove', removedRow, index)
  },

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
