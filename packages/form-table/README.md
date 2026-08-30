# FormTable

Vue 2.7 + Element UI 的轻量表格内表单组件，负责字段布局、校验路径和受控数据更新。

[![npm version](https://img.shields.io/npm/v/%40itagan%2Fform-table.svg)](https://www.npmjs.com/package/@itagan/form-table)

## 安装与兼容性

```bash
pnpm add @itagan/form-table@latest
```

- Vue `>=2.7.1 <3.0.0`
- Element UI `>=2.4.9 <3.0.0`
- 推荐 Vue `2.7.16` + Element UI `2.15.14`

Vue 3 和 Element Plus 暂不支持。完整安装与最低版本说明见[快速开始](https://github.com/itagan/form-table/blob/master/docs/guide/quick-start.md)。

## 样式入口

在应用入口按 Element UI → FormTable → 业务覆盖的顺序引入一次：

```ts
import 'element-ui/lib/theme-chalk/index.css'
import '@itagan/form-table/style.css'
import './form-table-overrides.css'
```

FormTable 样式不包含 Element UI 主题或全局 reset。完整覆盖规则见[样式加载与覆盖](https://github.com/itagan/form-table/blob/master/docs/architecture/style-loading.md)。

## 最小示例

```vue
<template>
  <FormTable
    ref="formTableRef"
    v-model="tableData"
    :columns="columns"
    :table-props="{ border: true }"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import FormTable from '@itagan/form-table'
import type { ColumnConfig, FormTableExpose } from '@itagan/form-table'

const formTableRef = ref<FormTableExpose | null>(null)
const tableData = ref([{ id: 1, name: '张三' }])
const columns: ColumnConfig[] = [{
  key: 'profile',
  label: '基本信息',
  formItems: [{
    key: 'name',
    fieldKey: 'name',
    type: 'input',
    formItemProps: {
      rules: [{ required: true, message: '请输入姓名' }]
    }
  }]
}]
</script>
```

根组件 `v-model` 对应 `tableData/update:tableData`。FormTable 不直接修改传入数组；字段输入和更新助手都会生成新数组交给父组件。

## 能力入口

| 目标 | 文档 |
| --- | --- |
| 查询 Props、Column、Item 和 Component 配置 | [API 总览](https://github.com/itagan/form-table/blob/master/docs/api/configuration.md) |
| 查询事件、校验和 Ref 方法 | [事件与 Ref](https://github.com/itagan/form-table/blob/master/docs/api/events-and-ref.md) |
| 接入非标准组件 model | [自定义字段组件](https://github.com/itagan/form-table/blob/master/docs/features/custom-component.md) |
| 一个组件映射多个字段 | [复合字段映射](https://github.com/itagan/form-table/blob/master/docs/features/composite-binding.md) |
| 批量更新、异步写回和稳定身份 | [数据更新与受控回写](https://github.com/itagan/form-table/blob/master/docs/features/data-updates.md) |
| 按业务任务寻找示例 | [开发任务导航](https://github.com/itagan/form-table/blob/master/docs/guide/development-workflows.md) |

一次性组件优先使用 `type: 'component'`，完全自定义字段模板使用 `type: 'slot'`。只有组件、model 和默认 Props 已跨页面稳定复用时，才注册自定义字段 Type。选择依据见[扩展模型](https://github.com/itagan/form-table/blob/master/docs/architecture/extension-model.md)。

完整文档和可运行 Playground 位于[项目文档](https://github.com/itagan/form-table/tree/master/docs)。仓库开发、测试和发布命令见[根 README](https://github.com/itagan/form-table)。
