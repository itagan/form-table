# 快速开始

```bash
pnpm add @itagan/form-table vue@^2.7.7 element-ui@^2.15.14
```

```vue
<template>
  <FormTable
    :table-data="tableData"
    :columns="columns"
    :table-props="{ border: true }"
    @update:tableData="tableData = $event"
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

复杂布局、自定义组件和 slot 参考 Playground 的 `/form-table-advanced`。
