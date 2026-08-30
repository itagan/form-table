# FormTable

Vue 2.7 + Element UI 的轻量表格内表单组件，负责布局、字段渲染、校验路径和受控数据更新。

[![npm version](https://img.shields.io/npm/v/%40itagan%2Fform-table.svg)](https://www.npmjs.com/package/@itagan/form-table)

## 安装与版本

`@itagan/form-table` 已作为 public scoped package 发布到 [npm Registry](https://www.npmjs.com/package/@itagan/form-table)。`latest` 标签对应的版本可直接安装：

```bash
pnpm add @itagan/form-table@latest
```

也可以使用 npm 或 Yarn：

```bash
npm install @itagan/form-table@latest
yarn add @itagan/form-table@latest
```

使用方需要预先安装并注册 Vue 与 Element UI：

- Vue `>=2.7.1 <3.0.0`
- Element UI `>=2.4.9 <3.0.0`
- 推荐 Vue `2.7.16` + Element UI `2.15.14`

Vue 3 和 Element Plus 暂不支持。完整兼容说明见[快速开始](https://github.com/itagan/form-table/blob/master/docs/guide/quick-start.md)。

## 样式入口

FormTable 的 JavaScript 与样式独立发布。请在应用入口按 Element UI → FormTable → 业务覆盖的顺序引入一次：

```ts
import 'element-ui/lib/theme-chalk/index.css'
import '@itagan/form-table/style.css'
import './form-table-overrides.css'
```

FormTable 样式只负责多字段换行、表格内 FormItem 间距，以及内置 `number/date/time/time-select` 的列宽适配，不包含 Element UI 主题、颜色、字体或全局 reset。业务可以在后加载的 CSS 中覆盖稳定类，也可以通过 `rowProps.style/formItemProps.style/component.props.style` 进行局部覆盖。完整边界见[样式加载与覆盖](https://github.com/itagan/form-table/blob/master/docs/architecture/style-loading.md)。

需要精确调整单元格内 `el-row`、`el-col`、`el-form-item` 或实际字段组件时，分别使用 `rowProps`、`colProps`、`formItemProps` 和 `component.props`。class/style、自定义组件根节点及 scoped CSS 示例见[样式定位与属性透传](https://github.com/itagan/form-table/blob/master/docs/features/style-props.md)。

## 最小示例

```ts
import FormTable, {
  defineFormTableColumns,
  type ColumnConfig
} from '@itagan/form-table'
import '@itagan/form-table/style.css'

const columns: ColumnConfig[] = defineFormTableColumns([{
  key: 'basic',
  label: '基本信息',
  formItems: [{
    key: 'name',
    fieldKey: 'name',
    type: 'input',
    formItemProps: {
      rules: [{ required: true, message: '请输入姓名' }]
    }
  }]
}])
```

```vue
<FormTable
  ref="formTableRef"
  v-model="tableData"
  :columns="columns"
  row-key="id"
  :form-props="{ size: 'small' }"
  :table-props="{ border: true }"
  :navigation-options="{ enabled: true }"
  @field-change="handleFieldChange"
  @sort-change="handleSortChange"
>
  <template #empty>暂无可编辑数据</template>
  <template #append>
    <el-button type="text" @click="loadMore">加载更多</el-button>
  </template>
</FormTable>
```

根组件 `v-model` 使用 `tableData/update:tableData`；`:table-data.sync` 仍兼容。字段输入和 Slot 更新助手均进行不可变写回。Table 原生事件直接透传，通过 ref 可调用整表或单字段校验、字段聚焦、首错定位，以及获取底层 Form/Table 实例。

`navigationOptions` 是可选增强；未配置时不改变原有键盘行为，启用后 Enter/Shift+Enter 会按当前实际显示顺序移动到下一个或上一个可编辑字段。Textarea、按钮、输入法组合和带修饰键的 Enter 不接管。

## 字段定位与批量更新

配置稳定且唯一的 `rowKey` 后，Ref 方法可以用业务行定位当前数据中的字段。校验失败时可以直接跳到首个错误，也可以只操作一个字段：

```ts
const valid = await formTableRef.value?.validateField(row, 'profile.phone')
await formTableRef.value?.focusField(row, 'profile.phone')

if (!await formTableRef.value?.validate()) {
  await formTableRef.value?.scrollToFirstError()
}
```

跨行字段修改使用 `updateRows`。它会先验证所有目标，只复制并发出一次新数组；任一目标无效时整批拒绝：

```ts
const updated = formTableRef.value?.updateRows(
  selectedRows.map(row => ({
    row,
    patch: { reviewed: true, 'audit.source': 'batch' }
  }))
)
```

完整规则见[数据更新与受控回写](https://github.com/itagan/form-table/blob/master/docs/features/data-updates.md)、[校验、清理与重置](https://github.com/itagan/form-table/blob/master/docs/features/validation-reset.md)和[Enter 字段导航](https://github.com/itagan/form-table/blob/master/docs/features/keyboard-navigation.md)。批量修改及键盘导航的可运行实现见[行列操作 Playground 源码](https://github.com/itagan/form-table/blob/master/playground/src/views/RowColumnOperationsView.vue)。

## Element Table 事件与根级 Slot

列相关事件继续在 FormTable 根组件监听，不配置额外的 `column.listeners`。排序、筛选、表头、单元格和选择事件均保留 Element UI 的原始参数：

```ts
import type {
  FormTableFilterChangePayload,
  FormTableSortChangePayload
} from '@itagan/form-table'

function handleSortChange({ prop, order }: FormTableSortChangePayload) {
  console.log(prop, order)
}

function handleFilterChange(filters: FormTableFilterChangePayload) {
  console.log(filters)
}
```

`#empty` 和 `#append` 会直接转发给 `el-table`，不增加额外 DOM 或 scope。未提供 `#empty` 时，`tableProps.emptyText` 和 Element UI 默认空状态保持有效。

需要让 Props、事件和动态配置回调共享业务行类型时，使用 `createFormTable<TRow>()` 和 `defineFormTableColumns<TRow>()`；两者都不会创建额外运行时实例。`fieldKey` 保持为字符串，以支持固定字段、嵌套路径和服务端动态字段。

## 高级扩展

一次性业务组件优先使用 `type: 'component'`，完全自定义字段模板使用 `type: 'slot'`。只有组件、model 和默认 Props 已经在多个页面稳定重复时，才使用实例级自定义 Type；远程 Schema 还需要额外的结构校验和可信前端白名单。

选择顺序、职责边界和高级注册入口见[扩展模型](https://github.com/itagan/form-table/blob/master/docs/architecture/extension-model.md)与[自定义字段 Type](https://github.com/itagan/form-table/blob/master/docs/features/custom-field-types.md)。

## 完整文档

详细行为统一维护在 VitePress 文档中：

- [快速开始](https://github.com/itagan/form-table/blob/master/docs/guide/quick-start.md)
- [开发任务导航](https://github.com/itagan/form-table/blob/master/docs/guide/development-workflows.md)
- [完整编辑提交流程](https://github.com/itagan/form-table/blob/master/docs/examples/form-workflow.md)
- [架构总览](https://github.com/itagan/form-table/blob/master/docs/architecture/overview.md)
- [配置与 API 总览](https://github.com/itagan/form-table/blob/master/docs/api/configuration.md)
- [事件与 Ref](https://github.com/itagan/form-table/blob/master/docs/api/events-and-ref.md)
- [公开类型](https://github.com/itagan/form-table/blob/master/docs/api/types.md)
- [数据更新与原子批量更新](https://github.com/itagan/form-table/blob/master/docs/features/data-updates.md)
- [字段校验、定位与聚焦](https://github.com/itagan/form-table/blob/master/docs/features/validation-reset.md)
- [Enter 字段导航](https://github.com/itagan/form-table/blob/master/docs/features/keyboard-navigation.md)
- [自定义字段 Type](https://github.com/itagan/form-table/blob/master/docs/features/custom-field-types.md)
- [功能专题](https://github.com/itagan/form-table/blob/master/docs/features/index.md)
- [示例索引](https://github.com/itagan/form-table/blob/master/docs/examples/index.md)
- [排错指南](https://github.com/itagan/form-table/blob/master/docs/guide/troubleshooting.md)

仓库开发、测试和发布命令见[根 README](https://github.com/itagan/form-table)。
