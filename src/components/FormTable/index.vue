<template>
  <div class="form-table-container">
    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
    >
      <el-table
        :data="tableData"
        :border="border"
        :stripe="stripe"
        :size="size"
        :show-header="showHeader"
        :highlight-current-row="highlightCurrentRow"
        :row-key="rowKey"
        :default-sort="defaultSort"
        v-loading="loading"
      >
        <FormTableColumn
          v-for="(column, columnIndex) in columns"
          :key="columnIndex"
          :column="column"
          :column-index="columnIndex"
        >
          <!-- 传递所有插槽 -->
          <template
            v-for="(_, slotName) in $slots"
            #[slotName]="slotProps"
          >
            <slot :name="slotName" v-bind="slotProps" />
          </template>
        </FormTableColumn>
      </el-table>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, provide } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import type { FormTableProps, FormTableEmits, TableRow, ColumnConfig, ValidationRule, CustomComponentConfig } from './types'

// Props定义
const props = withDefaults(defineProps<{
  tableData: TableRow[]
  columns: ColumnConfig[]
  rules: Record<string, ValidationRule[]>
  formData: Record<string, any>
  loading?: boolean
  border?: boolean
  stripe?: boolean
  size?: 'medium' | 'small' | 'mini'
  showHeader?: boolean
  highlightCurrentRow?: boolean
  rowKey?: string
  defaultSort?: {
    prop: string
    order: 'ascending' | 'descending'
  }
  labelWidth?: string
  labelPosition?: 'left' | 'right' | 'top'
  customComponents?: CustomComponentConfig[]
  showRowActions?: boolean
  rowActions?: {
    add?: boolean
    remove?: boolean
    copy?: boolean
    moveUp?: boolean
    moveDown?: boolean
  }
  actionColumnWidth?: string
  actionColumnLabel?: string
}>(), {
  tableData: () => [],
  columns: () => [],
  rules: () => ({}),
  formData: () => ({}),
  loading: false,
  border: true,
  stripe: false,
  size: 'medium',
  showHeader: true,
  highlightCurrentRow: false,
  rowKey: 'id',
  labelWidth: 'auto',
  labelPosition: 'right',
  customComponents: () => [],
  showRowActions: false,
  rowActions: () => ({
    add: true,
    remove: true,
    copy: false,
    moveUp: false,
    moveDown: false
  }),
  actionColumnWidth: '120px',
  actionColumnLabel: '操作'
})

// 事件定义
const emit = defineEmits([
  'update:tableData',
  'update:formData',
  'row-change',
  'row-add',
  'row-remove',
  'validate'
])

// 表单引用
const formRef = ref<any>(null)

// 提供自定义组件给子组件
const customComponentsMap = computed(() => {
  const map: Record<string, any> = {}
  props.customComponents?.forEach(comp => {
    map[comp.name] = comp.component
  })
  return map
})

// Vue 2 的 provide/inject
provide('customComponents', customComponentsMap)

// 计算属性
const tableData = computed(() => {
  return props.formData.tableData || props.tableData
})

// 监听数据变化
watch(() => props.tableData, (newVal) => {
  emit('update:tableData', newVal)
}, { deep: true })

watch(() => props.formData, (newVal) => {
  emit('update:formData', newVal)
}, { deep: true })

// 暴露方法
defineExpose({
  // 表单验证
  validate: async (callback?: (valid: boolean, errors: any[]) => void) => {
    try {
      const valid = await formRef.value?.validate()
      const errors: any[] = []
      emit('validate', valid, errors)
      callback?.(valid, errors)
      return valid
    } catch (error) {
      const errors: any[] = Array.isArray(error) ? error : [error]
      emit('validate', false, errors)
      callback?.(false, errors)
      return false
    }
  },
  
  // 重置表单
  resetFields: () => {
    formRef.value?.resetFields()
  },
  
  // 清除验证
  clearValidate: (props?: string | string[]) => {
    formRef.value?.clearValidate(props)
  },
  
  // 添加行
  addRow: (rowData?: Partial<TableRow>) => {
    const newRow = { ...rowData }
    const currentData = props.formData.tableData || props.tableData
    const newTableData = [...currentData, newRow]
    emit('update:tableData', newTableData)
    emit('row-add', newRow, newTableData.length - 1)
  },
  
  // 删除行
  removeRow: (index: number) => {
    const currentData = props.formData.tableData || props.tableData
    const newTableData = [...currentData]
    const removedRow = newTableData.splice(index, 1)[0]
    emit('update:tableData', newTableData)
    emit('row-remove', removedRow, index)
  },
  
  // 获取表单数据
  getFormData: () => {
    return {
      tableData: props.formData.tableData || props.tableData,
      ...props.formData
    }
  },
  
  // 设置表单数据
  setFormData: (data: Record<string, any>) => {
    if (data.tableData) {
      emit('update:tableData', data.tableData)
    }
    emit('update:formData', data)
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
