<template>
  <div class="form-table-container">
    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="rules"
      v-bind="formAttrs"
    >
      <el-table
        :data="tableData"
        v-bind="tableAttrs"
        v-loading="loading"
      >
        <FormTableColumn
          v-for="(column, columnIndex) in columns"
          :key="columnIndex"
          :column="column"
          :column-index="columnIndex"
        >
          <!-- 简化的插槽传递 -->
          <slot v-bind="slotProps" />
        </FormTableColumn>
      </el-table>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, provide, useAttrs, shallowRef, triggerRef, watchEffect } from 'vue'
import FormTableColumn from './FormTableColumn.vue'
import { extractFormAttrs, extractTableAttrs } from './utils/attrs'
import type { FormTableProps, FormTableEmits, TableRow, ColumnConfig, ValidationRule, CustomComponentConfig } from './types'

// 获取所有属性
const attrs = useAttrs()

// 只定义FormTable特有的props
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

// 提取el-form相关的属性
const formAttrs = computed(() => {
  return extractFormAttrs(attrs)
})

// 提取el-table相关的属性
const tableAttrs = computed(() => {
  return extractTableAttrs(attrs)
})

// 简化的插槽props
const slotProps = computed(() => ({
  row: null, // 在FormTableColumn中动态设置
  index: null // 在FormTableColumn中动态设置
}))

// 提供自定义组件给子组件 - 使用ref缓存优化性能
const customComponentsCache = ref<Record<string, any>>({})
const customComponentsMap = computed(() => {
  // 只有当customComponents真正变化时才重新计算
  const currentComponents = props.customComponents || []
  const cacheKey = currentComponents.map(c => c.name).join(',')
  
  if (customComponentsCache.value._cacheKey === cacheKey) {
    return customComponentsCache.value
  }
  
  const map: Record<string, any> = { _cacheKey: cacheKey }
  currentComponents.forEach(comp => {
    map[comp.name] = comp.component
  })
  
  customComponentsCache.value = map
  return map
})

// Vue 2 的 provide/inject
provide('customComponents', customComponentsMap)

// 使用shallowRef优化性能，避免深度监听
const tableData = shallowRef(props.tableData)
const formData = shallowRef(props.formData)

// 使用watchEffect替代深度监听，性能更好
watchEffect(() => {
  if (tableData.value !== props.tableData) {
    tableData.value = props.tableData
    triggerRef(tableData)
  }
})

watchEffect(() => {
  if (formData.value !== props.formData) {
    formData.value = props.formData
    triggerRef(formData)
  }
})

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
      ...formData.value
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
