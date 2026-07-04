# 快速开始

## 安装

```bash
pnpm add @itagan/form-table
```

使用方项目需要安装并注册：

- `vue@^2.7.7`
- `element-ui@^2.15.14`

## 引入

```ts
import 'element-ui/lib/theme-chalk/index.css'
import '@itagan/form-table/style.css'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'
```

## 最小用法

```vue
<template>
  <FormTable
    :table-data="tableData"
    :columns="columns"
    :rules="rules"
    :form-data="formData"
    border
  />
</template>
```

完整示例见：

- `playground/src/views/FormTableView.vue`
- `CURRENT_FORMTABLE_DOC.md`
