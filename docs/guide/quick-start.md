# 快速开始

本页只完成四件事：安装组件、引入样式、渲染第一个可编辑表格并执行校验。具体业务能力请在完成本页后按[开发任务导航](./development-workflows.md)继续查找。

## 安装

```bash
pnpm add @itagan/form-table@latest
```

使用 npm 或 Yarn 时安装同一个公开包：

```bash
npm install @itagan/form-table@latest
yarn add @itagan/form-table@latest
```

FormTable 使用宿主项目提供的 Vue 和 Element UI：

- Vue `>=2.7.1 <3.0.0`
- Element UI `>=2.4.9 <3.0.0`
- 推荐 Vue `2.7.16` + Element UI `2.15.14`

Vue 3、Element Plus、Vue 2.6 及更早版本不在支持范围内。最低版本组合 Vue `2.7.1`、Element UI `2.4.9` 已通过兼容测试。

## 注册依赖并引入样式

在应用入口注册 Element UI，并按 Element UI → FormTable → 业务覆盖的顺序引入样式：

```ts
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import '@itagan/form-table/style.css'
import App from './App.vue'

Vue.use(ElementUI)

new Vue({
  render: h => h(App)
}).$mount('#app')
```

`@itagan/form-table/style.css` 只包含字段布局和 FormItem 间距等组件结构样式，不包含 Element UI 主题或全局 reset。样式覆盖和 scoped CSS 规则见[样式加载与覆盖](../architecture/style-loading.md)。

## 渲染第一个表格

```vue
<template>
  <div>
    <FormTable
      ref="formTableRef"
      v-model="tableData"
      :columns="columns"
      :table-props="{ border: true }"
    />
    <el-button @click="validateTable">校验</el-button>
  </div>
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
    },
    component: {
      props: { placeholder: '请输入姓名', clearable: true }
    }
  }]
}]

const validateTable = () => formTableRef.value?.validate()
</script>
```

输入框应能直接编辑。清空姓名后点击“校验”，`validate()` 返回 `false` 并显示必填提示。

根组件 `v-model` 对应 `tableData/update:tableData`。FormTable 不直接修改传入数组；若页面必须合并 Store 或派生列表，可改用显式的 `:table-data` 与 `@update:tableData`。完整写回规则以[数据更新与受控回写](../features/data-updates.md)为准。

## 下一步

| 你要继续完成的事情 | 文档 |
| --- | --- |
| 接口加载、保存、撤销和脏状态 | [完整编辑提交流程](../examples/form-workflow.md) |
| 增删、复制、移动或批量更新行 | [开发任务导航：数据操作](./development-workflows.md#选择更新入口) |
| 接入非标准 Vue 2 model 组件 | [自定义字段组件](../features/custom-component.md) |
| 一个组件同时编辑多个字段 | [复合字段映射](../features/composite-binding.md) |
| 配置校验、字段聚焦和首错定位 | [校验、清理与重置](../features/validation-reset.md) |
| 查询完整属性路径和类型 | [API 总览](../api/configuration.md) |

可运行的基础页面位于 [`/form-table`](http://localhost:5173/form-table)，所有场景见[示例索引](../examples/)。
