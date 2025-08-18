# FormTable 组件

一个基于 Element UI 的表单嵌套表格组件，支持动态配置和表单验证。

## 功能特性

- 🎯 **灵活配置**: 通过 props 传入配置和数据，高度可定制
- 📝 **表单验证**: 支持完整的表单验证功能
- 🎨 **多种输入类型**: 支持 input、text、自定义插槽等多种类型
- 💡 **Tooltip 支持**: 可选的 tooltip 提示功能
- 🔧 **插槽扩展**: 支持自定义插槽组件
- 📱 **响应式布局**: 基于 Element UI 的栅格系统

## 安装和运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 使用方法

### 基础用法

```vue
<template>
  <FormTable
    :table-data="tableData"
    :columns="columns"
    :rules="rules"
    :form-data="formData"
    @update:table-data="handleTableDataUpdate"
    @update:form-data="handleFormDataUpdate"
  >
    <!-- 自定义插槽 -->
    <template #table-school="{ row, index }">
      <el-select v-model="row.school" placeholder="请选择学校">
        <el-option label="县一小" value="县一小"></el-option>
        <el-option label="县二中" value="县二中"></el-option>
      </el-select>
    </template>
  </FormTable>
</template>

<script setup>
import { ref, reactive } from 'vue'
import FormTable from '@/components/FormTable.vue'

// 表格数据
const tableData = ref([
  { name: '小米', age: 16, sex: '男', school: '县一小' },
  { name: '小2米', age: 32, sex: '男', school: '' }
])

// 表单数据
const formData = reactive({
  tableData: tableData.value
})

// 表单验证规则
const rules = ref({
  'tableData.*.name': [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  'tableData.*.age': [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '年龄必须在1-120之间', trigger: 'blur' }
  ]
})

// 列配置
const columns = ref([
  {
    name: '姓名和年龄',
    props: { width: '300px' },
    children: [{
      bind: { gutter: 10 },
      children: [
        {
          colSpan: 12,
          elFormItemProps: { key: 'name' },
          elInputProps: { placeholder: '请输入姓名' },
          type: 'input'
        },
        {
          colSpan: 12,
          elFormItemProps: { key: 'age' },
          elInputProps: { placeholder: '请输入年龄', type: 'number' },
          type: 'input'
        }
      ]
    }]
  }
])

// 事件处理
const handleTableDataUpdate = (newData) => {
  tableData.value = newData
  formData.tableData = newData
}

const handleFormDataUpdate = (newData) => {
  Object.assign(formData, newData)
}
</script>
```

## Props 说明

### tableData
- **类型**: `Array`
- **默认值**: `[]`
- **说明**: 表格数据数组

### columns
- **类型**: `Array`
- **默认值**: `[]`
- **说明**: 列配置数组

### rules
- **类型**: `Object`
- **默认值**: `{}`
- **说明**: 表单验证规则

### formData
- **类型**: `Object`
- **默认值**: `{}`
- **说明**: 表单数据对象

## Events

### update:tableData
- **参数**: `(newData: Array)`
- **说明**: 表格数据更新时触发

### update:formData
- **参数**: `(newData: Object)`
- **说明**: 表单数据更新时触发

## 列配置结构

```javascript
{
  name: '列名',
  props: {}, // el-table-column 的属性
  children: [
    {
      bind: {}, // el-row 的属性
      children: [
        {
          colSpan: 12, // el-col 的 span
          bind: {}, // el-col 的属性
          isUseTooltip: true, // 是否使用 tooltip
          elFormItemProps: {
            key: 'fieldName', // 表单字段名
            rules: [] // 验证规则
          },
          elTooltipProps: {}, // el-tooltip 的属性
          elInputProps: {}, // el-input 的属性
          type: 'input', // 类型: input, text, slotComponent
          slotName: 'slot-name' // 插槽名称（当 type 为 slotComponent 时）
        }
      ]
    }
  ]
}
```

## 演示页面

访问 `/form-table` 路由查看完整的演示页面，包含：
- 基础用法示例
- 表单验证演示
- 动态添加/删除行
- 自定义插槽组件

## 技术栈

- Vue 2.7
- Element UI
- TypeScript
- Vite
- Vue Router
