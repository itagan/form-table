# FormTable Props

## 属性路径

| 配置路径 | 类型 | TypeScript | 运行时默认值 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `tableData` | `TableRow[]` | 必填 | `[]` | 根组件 `v-model` 对应 prop；也是 `el-table.data` 的唯一数据源 |
| `columns` | `ColumnConfig[]` | 必填 | `[]` | 表格列、布局和字段渲染配置 |
| `formProps` | `ComponentProps` | 可选 | `{}` | 透传给 `el-form` |
| `tableProps` | `ComponentProps` | 可选 | `{}` | 透传给 `el-table` |
| `hintOptions` | `FormTableHintOptions<TRow>` | 可选 | `{ mode: 'title' }` | 整表 Hint 展示策略及字段统一格式化 |
| `loading` | `boolean` | 可选 | `false` | `el-table` 的 `v-loading` |

`tableData` 和 `columns` 在公开 `FormTableProps` 类型中是必填项；组件仍提供空数组作为运行时容错默认值。TypeScript 项目应显式传入两者，不依赖运行时默认值。

`hintOptions` 是可辨识联合：title 模式使用 `{ mode?: 'title' }`，Tooltip 模式使用 `{ mode: 'tooltip', props?: ComponentProps }`。两种模式都可配置 `field: boolean | FormTableFieldHintFormatter`：未配置或 `false` 表示无全局字段处理，`true` 默认字符串化，函数统一格式化。Item 不写或返回空值时继承，`false` 关闭，非空内容覆盖。表头不继承字段默认值。完整行为见 [Hint 提示体系](../features/hint.md)。

## 受控数据

FormTable 根组件的 `v-model` 映射到 `tableData/update:tableData`。组件不直接修改 `tableData`；字段输入、`setValue` 或 `updateRow` 会发出新数组：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
/>
```

三种写法使用同一协议：

| 场景 | 写法 |
| --- | --- |
| 日常双向绑定（推荐） | `v-model="tableData"` |
| Vue 2 具名兼容写法 | `:table-data.sync="tableData"` |
| 保存、审计等自定义回写 | `:table-data="tableData" @update:tableData="handleUpdate"` |

根组件 `v-model` 不发出额外的 `input` 事件；它通过 Vue 2 `model` 配置直接复用 `update:tableData`。这与 Item 的 `component.model` 不同：前者绑定整张表，后者适配某个字段组件的值协议。

本地回写必须立即执行；后端保存可在独立流程中防抖。各种更新入口、事件结果和异步行为见[数据更新与受控回写](../features/data-updates.md)。

## Element UI 透传

`formProps` 和 `tableProps` 不做白名单复制，由调用方按 Element UI 版本传入。FormTable 文档只列出透传入口，不重复枚举 Element UI 的全部原生属性。

```ts
const formProps = {
  size: 'small',
  labelPosition: 'left'
}

const tableProps = {
  border: true,
  rowKey: 'id',
  spanMethod
}
```

`tableProps.rowKey` 在异步字段回调或 `cellSlot.updateRow` 中用于重新定位原数据行。rowKey 必须唯一、稳定，不应使用数组下标。不同 key 的职责和配置时机见[稳定身份与异步安全](../features/stable-identity.md)。
