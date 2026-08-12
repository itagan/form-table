# 原生功能列

> 可运行 Demo：[高级示例 ↗](http://localhost:5173/form-table-advanced)

`NativeColumnConfig` 用于 Element UI 的选择列和序号列。这类列不绑定业务字段，也不创建 Row、Item 或 `el-form-item`。

## 基本配置

```ts
import { defineFormTableColumns, type NativeColumnConfig, type TableRow } from '@itagan/form-table'

const nativeColumns: NativeColumnConfig[] = [
  { type: 'selection', props: { width: 48 } },
  { type: 'index', label: '序号', props: { width: 64, align: 'center' } }
]

const columns = defineFormTableColumns<TableRow>([
  ...nativeColumns,
  {
    label: '姓名',
    children: [{
      children: [{ fieldKey: 'name', type: 'input' }]
    }]
  }
])
```

`type` 必须配置在列顶层，不能写入 `props`：

```ts
{ type: 'selection', props: { width: 48 } } // 正确
{ props: { type: 'selection' }, children: [] } // 不支持
```

## 选择列

选择结果使用 Element Table 原生 `selection-change` 事件接收：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  row-key="id"
  @selection-change="selection = $event"
/>

<span>已选择 {{ selection.length }} 行</span>
```

当表格会排序、替换行对象或保留选择状态时，应配置唯一稳定的顶层 `rowKey`。`props` 可继续使用 Element UI 选择列支持的属性，例如 `selectable` 和 `reserveSelection`：

```ts
{
  type: 'selection',
  props: {
    width: 48,
    reserveSelection: true,
    selectable: row => !row.locked
  }
}
```

## 序号列

不配置 `label` 时使用空表头。可通过 Element UI 原生 `index` 属性自定义序号：

```ts
{
  type: 'index',
  label: '序号',
  props: {
    width: 64,
    align: 'center',
    index: rowIndex => rowIndex + 100
  }
}
```

## 动态配置

原生列支持与其他列一致的 `key`、`visible` 和动态 `props`：

```ts
{
  key: 'selection-column',
  type: 'selection',
  visible: ({ tableData }) => tableData.length > 0,
  props: ({ tableData }) => ({
    width: tableData.length > 100 ? 56 : 48
  })
}
```

## 能力边界

| 能力 | `NativeColumnConfig` |
| --- | --- |
| 支持类型 | `selection`、`index` |
| 可选配置 | `key`、`label`、`visible`、`props` |
| 字段路径与校验 | 不支持 |
| `children` / `cellSlot` | 不支持 |
| 自定义表头配置 | 不支持 |
| `expand` | 暂不支持；需要单独设计展开内容 API |

需要操作按钮、状态组合或图片时使用 [`cellSlot`](./cell-slot.md)；需要字段绑定和校验时使用普通布局列。

