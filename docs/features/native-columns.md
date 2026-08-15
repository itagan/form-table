# Element 功能列透传

> 可运行 Demo：[Element 功能列透传 ↗](http://localhost:5173/element-columns)

`NativeColumnConfig` 表示一个不进入 FormTable 字段渲染链路的原生 `el-table-column`。它不重新定义 Element UI API，而是把 `props` 原样交给 `el-table-column`，适合选择列、序号列等原生功能。

## 基本配置

```ts
import { defineFormTableColumns, type TableRow } from '@itagan/form-table'

const columns = defineFormTableColumns<TableRow>([
  { props: { type: 'selection', width: 48 } },
  { label: '序号', props: { type: 'index', width: 64, align: 'center' } },
  {
    label: '姓名',
    formItems: [{ fieldKey: 'name', type: 'input' }]
  }
])
```

直接配置在 `columns` 中不会产生类型警告。TypeScript 会根据“具有 `props`，但没有 `formItems/cellSlot`”的结构自动识别为 `NativeColumnConfig`，通常无需显式导入这个类型。只有抽取可复用的原生 Element 列数组或编写配置工具时，才需要声明 `NativeColumnConfig[]`。

`type` 属于 Element UI 的 `el-table-column` Prop，因此保留在 `props` 中。纯透传列不需要为了通过类型检查而配置无意义的 `formItems: []`：

```ts
{ props: { type: 'selection', width: 48 } } // 正确
{ props: { type: 'selection' }, formItems: [] } // 不需要，也不允许混用
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

## 排序与筛选事件

排序、筛选和表头交互由 Element Table 在根组件发出，不需要为列增加监听器配置：

```ts
const columns = defineFormTableColumns<TableRow>([{
  label: '姓名',
  props: {
    prop: 'name',
    sortable: 'custom',
    columnKey: 'name-column',
    filters: [
      { text: 'A 开头', value: 'A' },
      { text: 'B 开头', value: 'B' }
    ]
  }
}])
```

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  @sort-change="handleSortChange"
  @filter-change="handleFilterChange"
  @header-click="handleHeaderClick"
/>
```

事件参数遵循 Element UI 原生顺序；`columnKey` 用于识别 `filter-change` 返回的筛选列。公开载荷类型见[事件与 Ref](../api/events-and-ref.md)。[可运行 Demo ↗](http://localhost:5173/element-columns) 会实时显示排序、筛选和表头点击结果。

## 空状态与表尾

Element Table 的两个根级 Slot 可直接写在 FormTable 下：

```vue
<FormTable v-model="tableData" :columns="columns">
  <template #empty>
    <span>暂无可编辑数据</span>
  </template>
  <template #append>
    <el-button type="text" @click="loadMore">加载更多</el-button>
  </template>
</FormTable>
```

`empty` 只在无数据时展示；`append` 在有无数据时都遵循 Element UI 原生渲染行为。未声明相应 Slot 时不会覆盖 Element UI 默认空状态，也不会创建 append 区域。

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

| 能力 | `NativeColumnConfig` |
| --- | --- |
| Element Column 属性 | 通过 `props` 原样透传 |
| 可选配置 | `key`、`label`、`visible` |
| 字段路径与校验 | 不支持 |
| `formItems` / `cellSlot` | 不支持 |
| FormTable 自定义表头 | 不支持 |

FormTable 不维护 `selection/index/expand` 枚举，具体属性遵循当前 Element UI 版本。需要内容的原生列可组合现有 `cellSlot`，例如展开列：

```ts
{ label: '详情', props: { type: 'expand' }, cellSlot: 'row-detail' }
```

需要 FormTable 字段绑定和校验时使用布局列，需要操作按钮或组合展示时使用 [`cellSlot`](./cell-slot.md)。
