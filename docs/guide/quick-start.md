# 快速开始

## 安装

```bash
pnpm add @itagan/form-table
```

FormTable 将 Vue 和 Element UI 声明为 peer dependencies，不会重复安装或注册它们。接入前请确认项目已安装并注册 Element UI，且依赖版本满足：

- `vue@^2.7.7`
- `element-ui@^2.15.14`

对应的支持范围是 Vue `>=2.7.7 <3.0.0`、Element UI `>=2.15.14 <3.0.0`。

### 版本不满足时

- Vue 版本低于 `2.7.7`：请先将现有项目升级到 Vue `^2.7.7`。Vue 2.6 及更早版本不在当前版本的支持和测试范围内；如果项目暂时无法升级，不建议通过忽略 peer dependency 警告强制安装。
- Element UI 版本低于 `2.15.14`：请先升级到 `^2.15.14`；无法升级时，当前版本不保证正常运行。
- Vue 3：暂不支持。本组件基于 Vue 2.7 和 Element UI 2.x，不能在 Vue 3 项目中通过替换为 Element Plus 直接使用。

升级宿主项目依赖时，可单独执行：

```bash
pnpm add vue@^2.7.7 element-ui@^2.15.14
```

如果安装器报告 peer dependency 冲突，请先检查项目实际解析出的版本（例如运行 `pnpm list vue element-ui`），将版本调整到上述范围后再安装 FormTable。

## 基础使用

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
