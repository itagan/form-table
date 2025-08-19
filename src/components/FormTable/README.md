# FormTable 组件

基于 Element Plus 的表单嵌套表格组件，支持动态表单验证和多种输入类型。

## 特性

- 🎯 完整的 TypeScript 支持
- 🔧 灵活的配置选项
- ✅ 内置表单验证
- 🎨 可定制样式
- 📱 响应式布局
- 🔌 插槽支持

## 使用方法

```vue
<template>
  <FormTable
    v-model:table-data="tableData"
    :columns="columns"
    :rules="rules"
  />
</template>

<script setup lang="ts">
import FormTable from '@/components/FormTable/index.vue'

const tableData = ref([
  { id: 1, name: '张三', age: 25 }
])

const columns = [
  {
    name: '基本信息',
    children: [
      {
        children: [
          {
            key: 'name',
            type: 'input',
            placeholder: '请输入姓名',
            colSpan: 12
          },
          {
            key: 'age',
            type: 'number',
            placeholder: '请输入年龄',
            colSpan: 12
          }
        ]
      }
    ]
  }
]
</script>
```

## 支持的输入类型

- input: 文本输入框
- number: 数字输入框
- textarea: 多行文本
- select: 下拉选择
- date: 日期选择器
- switch: 开关
- text: 纯文本显示
- slotComponent: 自定义插槽

## 组件方法

- validate(): 表单验证
- resetFields(): 重置表单
- addRow(): 添加行
- removeRow(): 删除行
