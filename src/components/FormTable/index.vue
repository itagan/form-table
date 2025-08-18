<template>
  <div class="form-table-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-loading-spinner />
    </div>
    
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
        element-loading-text="加载中..."
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(0, 0, 0, 0.8)"
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
import { ref, watch, nextTick, computed } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import type { FormTableProps, FormTableEmits, TableRow } from './types'

// Props定义
const props = withDefaults(defineProps<FormTableProps>(), {
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
  labelPosition: 'right'
})

// 事件定义
const emit = defineEmits<FormTableEmits>()

// 表单引用
const formRef = ref<any>(null)

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

// 监听行数据变化
const handleRowChange = (row: TableRow, index: number) => {
  emit('row-change', row, index)
}

// 暴露方法
defineExpose({
  // 表单验证
  validate: async (callback?: (valid: boolean, errors: any[]) => void) => {
    try {
      const valid = await formRef.value?.validate()
      const errors = []
      emit('validate', valid, errors)
      callback?.(valid, errors)
      return valid
    } catch (error) {
      const errors = Array.isArray(error) ? error : [error]
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
    const newTableData = [...tableData.value, newRow]
    emit('update:tableData', newTableData)
    emit('row-add', newRow, newTableData.length - 1)
  },
  
  // 删除行
  removeRow: (index: number) => {
    const newTableData = [...tableData.value]
    const removedRow = newTableData.splice(index, 1)[0]
    emit('update:tableData', newTableData)
    emit('row-remove', removedRow, index)
  },
  
  // 获取表单数据
  getFormData: () => {
    return {
      tableData: tableData.value,
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
  position: relative;
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
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
