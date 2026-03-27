<template>
  <div class="form-table-container">
    <el-form
      ref="formRef"
      :model="props.formData"
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
          :key="columnIndex"
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
import { computed, provide, ref, useAttrs } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import { extractFormAttrs, extractTableAttrs } from './utils/attrs'
import type {
  ColumnConfig,
  CustomComponentConfig,
  ValidationRule,
  TableRow
} from './types'

const attrs = useAttrs()

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

const emit = defineEmits([
  'update:tableData',
  'update:formData',
  'row-add',
  'row-remove',
  'validate',
  'event'
])

const formRef = ref<any>(null)

const formAttrs = computed(() => extractFormAttrs(attrs))
const tableAttrs = computed(() => extractTableAttrs(attrs))

const customComponentsMap = computed(() => {
  const map: Record<string, any> = {}
  props.customComponents.forEach((item) => {
    map[item.name] = item.component
  })
  return map
})

provide('customComponents', customComponentsMap)

type DispatchEventName =
  | 'update:tableData'
  | 'update:formData'
  | 'row-add'
  | 'row-remove'
  | 'validate'

const dispatch = (type: DispatchEventName, ...args: any[]) => {
  emit(type, ...args)
  emit('event', { type, args })
}

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
    dispatch('update:tableData', nextTableData)
    dispatch('row-add', newRow, nextTableData.length - 1)
  },

  removeRow: (index: number) => {
    const nextTableData = [...props.tableData]
    const removedRow = nextTableData.splice(index, 1)[0]
    dispatch('update:tableData', nextTableData)
    dispatch('row-remove', removedRow, index)
  },

  getFormData: () => ({
    tableData: props.tableData,
    ...props.formData
  }),

  setFormData: (data: Record<string, any>) => {
    if (data.tableData) {
      dispatch('update:tableData', data.tableData)
    }
    dispatch('update:formData', data)
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
