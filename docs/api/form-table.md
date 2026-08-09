# FormTable Props

## 属性路径

| 配置路径 | 类型 | 必填 / 默认值 | 目标 / 作用 |
| --- | --- | --- | --- |
| `tableData` | `TableRow[]` | `[]` | `el-table.data`，唯一受控数据源 |
| `columns` | `ColumnConfig[]` | `[]` | 表格列、布局和字段渲染配置 |
| `formProps` | `ComponentProps` | `{}` | 透传给 `el-form` |
| `tableProps` | `ComponentProps` | `{}` | 透传给 `el-table` |
| `loading` | `boolean` | `false` | `el-table` 的 `v-loading` |

## 受控数据

FormTable 不直接修改 `tableData`。字段输入、`setValue` 或 `updateRow` 会发出新数组：

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  @update:tableData="tableData = $event"
/>
```

本地回写必须立即执行；后端保存可在独立流程中防抖。详细事件语义见 [事件与 Ref](./events-and-ref.md)。

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

`tableProps.rowKey` 在异步字段回调或 `cellSlot.updateRow` 中用于重新定位原数据行。rowKey 必须唯一、稳定，不应使用数组下标。
