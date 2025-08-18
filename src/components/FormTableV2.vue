<!-- 优化后的表单嵌套表格组件 -->
<template>
  <div class="form-table-v2">
    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="rules"
    >
      <el-table
        :data="tableData"
        :border="border"
        :stripe="stripe"
        :size="size"
        v-loading="loading"
      >
        <el-table-column
          v-for="(column, columnIndex) in columns"
          :key="columnIndex"
          :label="column.name"
          v-bind="column.props"
        >
          <template v-slot="scope">
            <div class="form-row">
              <el-row 
                v-for="(rowItem, rowIndex) in column.children"
                :key="rowIndex"
                :gutter="rowItem.gutter || 10"
              >
                <el-col 
                  v-for="(colItem, colIndex) in rowItem.children"
                  :key="colIndex"
                  :span="colItem.colSpan || 24"
                >
                  <el-form-item 
                    :prop="`tableData.${scope.$index}.${colItem.key}`"
                    :rules="colItem.rules"
                  >
                    <!-- Input -->
                    <el-input 
                      v-if="colItem.type === 'input'"
                      v-model="scope.row[colItem.key]"
                      :placeholder="colItem.placeholder || '请输入'"
                      clearable
                    />
                    
                    <!-- Number Input -->
                    <el-input-number 
                      v-else-if="colItem.type === 'number'"
                      v-model="scope.row[colItem.key]"
                      :placeholder="colItem.placeholder || '请输入'"
                      :min="colItem.min || 0"
                    />
                    
                    <!-- Switch -->
                    <el-switch 
                      v-else-if="colItem.type === 'switch'"
                      v-model="scope.row[colItem.key]"
                    />
                    
                    <!-- Text Display -->
                    <span 
                      v-else-if="colItem.type === 'text'"
                    >
                      {{ scope.row[colItem.key] }}
                    </span>
                    
                    <!-- Default Input -->
                    <el-input 
                      v-else
                      v-model="scope.row[colItem.key]"
                      :placeholder="colItem.placeholder || '请输入'"
                      clearable
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'

// Props定义
const props = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  rules: {
    type: Object,
    default: () => ({})
  },
  formData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  border: {
    type: Boolean,
    default: true
  },
  stripe: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium'
  }
})

// 事件定义
const emit = defineEmits([
  'update:tableData',
  'update:formData'
])

// 表单引用
const formRef = ref()

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
  validate: async () => {
    try {
      return await formRef.value?.validate()
    } catch (error) {
      return false
    }
  },
  
  resetFields: () => {
    formRef.value?.resetFields()
  },
  
  clearValidate: (props?: string | string[]) => {
    formRef.value?.clearValidate(props)
  },
  
  addRow: (rowData?: any) => {
    const newRow = { ...rowData }
    const newTableData = [...tableData.value, newRow]
    emit('update:tableData', newTableData)
  },
  
  removeRow: (index: number) => {
    const newTableData = [...tableData.value]
    newTableData.splice(index, 1)
    emit('update:tableData', newTableData)
  }
})
</script>

<style lang="less" scoped>
.form-table-v2 {
  .form-row {
    .el-row {
      .el-col {
        .el-form-item {
          margin-bottom: 0;
          
          .el-form-item__content {
            line-height: 1;
          }
        }
      }
    }
  }
  
  :deep(.el-table) {
    .el-table__body-wrapper {
      .el-table__row {
        .el-table__cell {
          padding: 8px 0;
        }
      }
    }
  }
}
</style> 
