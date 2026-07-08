# 快速开始

FormTable 面向 `Vue 2.7 + Element UI` 项目。它把 `el-form` 和 `el-table` 组合成“表格内表单”，同时保留 Element UI 的表格事件、表单校验和常用 ref 方法。

## 安装

```bash
pnpm add @itagan/form-table
```

使用方项目需要自行安装并注册 peer dependencies：

- `vue@^2.7.7`
- `element-ui@^2.15.14`

## 引入

```ts
import 'element-ui/lib/theme-chalk/index.css'
import '@itagan/form-table/style.css'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'
```

如果项目使用全局注册：

```ts
import Vue from 'vue'
import { FormTablePlugin } from '@itagan/form-table'

Vue.use(FormTablePlugin)
```

## 最小用法

```vue
<template>
  <FormTable
    :table-data="tableData"
    :columns="columns"
    border
    @update:tableData="tableData = $event"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, TableRow } from '@itagan/form-table'

export default Vue.extend({
  components: { FormTable },
  data() {
    const tableData: TableRow[] = [
      { name: '张三', age: 25, school: '县一小' },
      { name: '李四', age: 30, school: '市一中' }
    ]

    const columns: ColumnConfig[] = [
      {
        name: '姓名',
        required: true,
        props: { width: '180px' },
        children: [{
          children: [{
            key: 'name',
            type: 'input',
            placeholder: '请输入姓名',
            required: true,
            requiredMessage: '请输入姓名'
          }]
        }]
      },
      {
        name: '年龄',
        props: { width: '160px' },
        children: [{
          children: [{
            key: 'age',
            type: 'number',
            required: true,
            requiredMessage: '请输入年龄',
            component: {
              bind: { min: 1, max: 120 }
            }
          }]
        }]
      },
      {
        name: '学校',
        children: [{
          children: [{
            key: 'school',
            type: 'select',
            placeholder: '请选择学校',
            required: true,
            requiredMessage: '请选择学校',
            options: [
              { label: '县一小', value: '县一小' },
              { label: '县二中', value: '县二中' },
              { label: '市一中', value: '市一中' }
            ]
          }]
        }]
      }
    ]

    return { tableData, columns }
  }
})
</script>
```

## 插槽字段

字段设置为 `type: 'slot'` 后，使用 `component.slotName` 指定插槽名。插槽里推荐通过 `setValue` 更新字段，这样会进入和内置组件一致的 `update:tableData`、`field-change`、校验清理链路。

```ts
const columns: ColumnConfig[] = [{
  name: '学校',
  children: [{
    children: [{
      key: 'school',
      type: 'slot',
      component: {
        slotName: 'table-school'
      }
    }]
  }]
}]
```

```vue
<template #table-school="{ value, setValue }">
  <el-select :value="value" placeholder="请选择学校" @input="setValue">
    <el-option label="县一小" value="县一小" />
    <el-option label="县二中" value="县二中" />
    <el-option label="市一中" value="市一中" />
  </el-select>
</template>
```

## 本地调试

仓库内 playground 已经接入源码包，可以用它验证真实页面行为：

```bash
pnpm install
pnpm dev
```

文档站单独使用 VitePress 依赖，第一次运行前建议先安装 docs 依赖：

```bash
pnpm docs:install
pnpm docs:dev
```

完整示例参考：

- `playground/src/views/FormTableView.vue`
- `playground/src/views/FormTableAdvancedView.vue`
- `playground/src/views/DynamicSlotTestView.vue`
