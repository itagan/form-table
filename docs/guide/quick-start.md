# 快速开始

## 安装

```bash
pnpm add @itagan/form-table
```

FormTable 将 Vue 和 Element UI 声明为 peer dependencies，不会重复安装或注册它们。接入前请确认项目已安装并注册 Element UI，且依赖版本满足：

- `vue@^2.7.1`
- `element-ui@^2.4.9`

对应的支持范围是 Vue `>=2.7.1 <3.0.0`、Element UI `>=2.4.9 <3.0.0`。最低版本组合 Vue `2.7.1`、Element UI `2.4.9` 已通过现有行为测试。

**最佳建议版本：Vue `2.7.16` + Element UI `2.15.14`。** 两者分别是 Vue 2 和 Element UI 2 的最终发布版本，包含各自 Vue 2 生态中最完整的修复；FormTable 也使用该组合进行日常开发和完整回归测试。新项目或没有旧版本约束的项目应优先采用此组合。

### 版本不满足时

- Vue `2.7.0` 或更早版本：请先升级到 Vue `^2.7.1`。组件使用 Vue 2.7 内置的 Composition API，Vue 2.6 及更早版本不受支持；Vue `2.7.0` 在兼容测试中也存在渲染异常。
- Element UI 版本低于 `2.4.9`：请先升级到 `^2.4.9`。FormTable 的表头 Slot 依赖 Element UI `2.4.9` 引入的 Table 表头 scoped slot；若不受旧项目约束，建议直接升级到最终版本 `2.15.14`。
- Vue 3：暂不支持。本组件基于 Vue 2.7 和 Element UI 2.x，不能在 Vue 3 项目中通过替换为 Element Plus 直接使用。

升级宿主项目依赖时，可单独执行：

```bash
pnpm add vue@^2.7.1 element-ui@^2.4.9
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

操作列、末尾新增、当前行后插入、复制和删除参考[常见操作列与行增删](../features/common-row-actions.md)；动态列以及确认或接口成功后再修改表格，参考[行、列与延迟提交](./row-column-operations.md)。
