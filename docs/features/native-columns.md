# Element 功能列透传

> 可运行 Demo：[Element 功能列透传 ↗](http://localhost:5173/element-columns)

`PlainColumnConfig` 表示一个不进入 FormTable 字段渲染链路的纯 `el-table-column`。它不重新定义 Element UI API，而是把 `props` 原样交给 `el-table-column`，适合选择列、序号列等原生功能。

## 基本配置

```ts
import { defineFormTableColumns, type TableRow } from '@itagan/form-table'

const columns = defineFormTableColumns<TableRow>([
  { props: { type: 'selection', width: 48 } },
  { label: '序号', props: { type: 'index', width: 64, align: 'center' } },
  {
    label: '姓名',
    children: [{
      children: [{ fieldKey: 'name', type: 'input' }]
    }]
  }
])
```

直接配置在 `columns` 中不会产生类型警告。TypeScript 会根据“具有 `props`，但没有 `children/cellSlot`”的结构自动识别为 `PlainColumnConfig`，通常无需显式导入这个类型。只有抽取可复用的纯 Element 列数组或编写配置工具时，才需要声明 `PlainColumnConfig[]`。

`type` 属于 Element UI 的 `el-table-column` Prop，因此保留在 `props` 中。纯透传列不需要为了通过类型检查而配置无意义的 `children: []`：

```ts
{ props: { type: 'selection', width: 48 } } // 正确
{ props: { type: 'selection' }, children: [] } // 不需要，也不允许混用
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

当表格会排序、替换行对象或保留选择状态时，应配置唯一稳定的顶层 `rowKey`。选择列的其他能力也继续放在 `props`：

```ts
{
  props: {
    type: 'selection',
    width: 48,
    reserveSelection: true,
    selectable: row => !row.locked
  }
}
```

## 序号列

不配置 `label` 时使用空表头。可通过 Element UI 原生 `index` Prop 自定义序号：

```ts
{
  label: '序号',
  props: {
    type: 'index',
    width: 64,
    align: 'center',
    index: rowIndex => rowIndex + 100
  }
}
```

## 动态配置

纯透传列支持 `key`、`label`、`visible` 和动态 `props`：

```ts
{
  key: 'selection-column',
  visible: ({ tableData }) => tableData.length > 0,
  props: ({ tableData }) => ({
    type: 'selection',
    width: tableData.length > 100 ? 56 : 48
  })
}
```

## 能力边界

| 能力 | `PlainColumnConfig` |
| --- | --- |
| Element Column 属性 | 通过 `props` 原样透传 |
| 可选配置 | `key`、`label`、`visible` |
| 字段路径与校验 | 不支持 |
| `children` / `cellSlot` | 不支持 |
| FormTable 自定义表头 | 不支持 |

FormTable 不维护 `selection/index/expand` 枚举，具体属性遵循当前 Element UI 版本。需要内容的原生列可组合现有 `cellSlot`，例如展开列：

```ts
{ label: '详情', props: { type: 'expand' }, cellSlot: 'row-detail' }
```

需要 FormTable 字段绑定和校验时使用布局列，需要操作按钮或组合展示时使用 [`cellSlot`](./cell-slot.md)。
