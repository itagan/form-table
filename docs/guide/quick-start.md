# 快速开始

## 安装

`@itagan/form-table` 已公开发布到 [npm Registry](https://www.npmjs.com/package/@itagan/form-table)。推荐安装 `latest` 标签；需要锁定版本时，再把 `latest` 替换为项目确认过的具体版本号。

```bash
pnpm add @itagan/form-table@latest
```

其他包管理器使用同一个公开包：

```bash
npm install @itagan/form-table@latest
yarn add @itagan/form-table@latest
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

在应用入口注册 Element UI，并引入 Element UI 与 FormTable 的样式：

```ts
// main.ts
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

### 样式入口与覆盖

`@itagan/form-table/style.css` 需要在整个应用中显式引入一次。它只包含字段换行和 FormItem 间距两项 FormTable 布局修正，不包含 Element UI 主题、颜色、字体或全局 reset。

推荐顺序是 Element UI → FormTable → 业务覆盖样式。需要统一调整布局时，在后引入的业务 CSS 中覆盖稳定类名：

```css
.form-table-field-layout {
  flex-wrap: nowrap;
}

.form-table-container .form-table-form-item {
  margin-bottom: 8px;
}
```

单个列或字段使用 `rowProps.style`、`formItemProps.style` 覆盖。完整的构建、SSR、UMD 和嵌套表边界见[样式加载与覆盖契约](../architecture/style-loading.md)。

然后在页面中直接引入并使用 FormTable：

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
const tableData = ref([{ name: '张三' }])
const columns: ColumnConfig[] = [{
  label: '姓名',
  formItems: [{
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

输入框应可以正常编辑；清空“姓名”后点击“校验”，`validate()` 会得到 `false` 并显示必填提示。后续页面可继续沿用同一份全局注册和样式入口。

对应的逐步说明和行操作边界见[基础编辑示例](../examples/basic-editing.md)。需要继续接入接口加载、保存、撤销和未保存状态时，直接进入[完整编辑提交流程](../examples/form-workflow.md)。

根组件 `v-model` 绑定整张表的 `tableData`，底层复用 `tableData/update:tableData`，因此它本身就是受控回写的推荐简写。判断方法很直接：若事件处理器只会执行 `tableData = $event`，使用 `v-model`；若必须调用 Store、把派生列表合并回源数组或转换 DTO，才显式组合 `:table-data` 与 `@update:tableData`。数据会被接口刷新并不影响选择，保存等副作用也可以继续监听本地数据或 `field-change`。

完成基础编辑后，先通过[扩展模型](../architecture/extension-model.md)判断应该使用直接组件、字段 Slot 还是 `cellSlot`。字段 Slot 和动态显隐参考 `/dynamic-slot-test`，列级自定义单元格参考 `/cell-slot`；Hint 行为可直接打开 `/hint-scenarios`。

操作列、末尾新增、当前行后插入、复制和删除参考[常见操作列与行增删](../features/common-row-actions.md)；动态列以及确认或接口成功后再修改表格，参考[行列操作与异步提交](../features/row-column-operations.md)。

自定义 Type 属于高级扩展。只有同一业务组件及其 model 协议已经在多个页面稳定复用时，才考虑通过 `defineFormTableTypes` 注册业务名称。一次性组件优先使用 `type: 'component'`，多组件模板使用 `type: 'slot'`；完整注册和泛型配对见[自定义字段 Type](../features/custom-field-types.md)。
