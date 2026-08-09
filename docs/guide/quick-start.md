# 快速开始

```bash
pnpm add @itagan/form-table vue@^2.7.7 element-ui@^2.15.14
```

```vue
<template>
  <FormTable
    v-model="tableData"
    :columns="columns"
    :table-props="{ border: true }"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig } from '@itagan/form-table'

const tableData = ref([{ name: '张三' }])
const columns: ColumnConfig[] = [{
  label: '姓名',
  children: [{
    children: [{
      fieldKey: 'name',
      type: 'input',
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }]
      },
      component: {
        props: { placeholder: '请输入姓名', clearable: true }
      }
    }]
  }]
}]
</script>
```

根组件 `v-model` 绑定整张表的 `tableData`，底层复用 `tableData/update:tableData`。已有的 `:table-data.sync="tableData"` 继续兼容；需要在回写时执行保存等逻辑，可显式监听 `@update:tableData`。

复杂布局和字段 Slot 参考 Playground 的 `/form-table-advanced`。原生提示、自定义表头、列级单元格和自定义组件等独立能力可从[功能专题](../features/)选择配置与使用示例。

行增删、动态列以及确认或接口成功后再修改表格，参考[行、列与延迟提交](./row-column-operations.md)。
