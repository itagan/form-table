# cellSlot 列级单元格

> 可运行 Demo：[打开 cellSlot 专项页 ↗](http://localhost:5173/cell-slot)

`cellSlot` 是与 Row / Item 字段链路并列的列级渲染入口。它适合操作按钮、状态、图片、派生值和多字段组合展示。

## 配置示例

```ts
const columns: ColumnConfig[] = [{
  key: 'actions-column',
  label: '操作',
  cellSlot: 'row-actions',
  props: { width: 180, fixed: 'right' }
}]
```

## 使用示例

这里只展示最小的当前行更新和删除；末尾新增、当前行后插入、复制与删除的完整组合见[常见操作列与行增删](./common-row-actions.md)。

```vue
<template #row-actions="{ row, index, updateRow }">
  <el-button @click="updateRow({ enabled: !row.enabled })">切换</el-button>
  <el-button @click="removeRow(index)">删除</el-button>
</template>
```

## 渲染路径

```text
cellSlot 列
el-table-column → scoped Slot

字段列
el-table-column → el-row → el-col → el-form-item → Component / Field Slot
```

`cellSlot` 不创建 FormTable 内部的 `el-row/el-col/el-form-item`，Slot 返回的 VNode 直接进入 Element UI 单元格。

## 配置路径

| 路径 | 类型 | 说明 |
| --- | --- | --- |
| `columns[].cellSlot` | `string` | 父组件具名 scoped Slot |
| `columns[].children` | `never` | 与 `cellSlot` 互斥 |
| `columns[].key` | `string` | 建议为动态列提供稳定身份 |
| `columns[].props` | `DynamicValue<ComponentProps, ColumnContext>` | 透传 `el-table-column` |
| `columns[].headerSlot/headerProps/headerHint` | 列级配置 | 与字段列共用表头能力 |

## Slot scope

```ts
interface FormTableCellSlotContext {
  row: Readonly<TableRow>
  index: number
  columnConfig: Readonly<CellSlotColumnConfig>
  updateRow: (patch: Partial<TableRow>) => void
}
```

| 字段 | 时效 | 说明 |
| --- | --- | --- |
| `row` | 渲染快照 | 当前行，不要直接修改 |
| `index` | 渲染快照 | 适合同步 UI 操作，不作为异步行身份 |
| `columnConfig` | 配置快照 | 当前列原始配置 |
| `updateRow` | 绑定当前行 | 不可变更新，patch key 支持嵌套路径 |

不提供：

```text
tableData / columnIndex / fieldKey / value / setValue
rowConfig / itemConfig / propPath / component
```

## 与字段 Slot 的选择

| 问题 | 选择 |
| --- | --- |
| 只从 `row` 读取展示值或执行行操作 | `cellSlot` |
| 需要 `fieldKey/value/setValue` | `type: 'slot'` |
| 需要 `formItemProps.rules` 或 `propPath` | `type: 'slot'` |
| 需要已解析 `component.props/options/listeners` | `type: 'slot'` |
| 原生选择、序号或展开列 | `column.props.type` |

`cellSlot` 内可以放置交互组件，但若它本质上是需要 FormTable 校验和字段写回的编辑器，仍应使用字段 Slot。

## updateRow 与事件

```vue
<template #row-actions="{ updateRow }">
  <el-button @click="updateRow({
    status: 'approved',
    'audit.operatorId': currentUser.id
  })">通过</el-button>
</template>
```

一次 `updateRow` 最多发出一个 `update:tableData`，并为每个实际变化的 patch key 发出 `field-change`。相同值会跳过；所有值都未变时不发出事件。

使用根组件 `v-model` 会自动立即回写：

```vue
<FormTable v-model="tableData" :columns="columns">
  <!-- cellSlot 模板 -->
</FormTable>
```

需要显式监听 `update:tableData` 时，处理器也必须先同步父组件状态。

## 异步操作与 rowKey

```ts
const tableProps = { rowKey: 'id' }

async function approve(context: FormTableCellSlotContext) {
  await save(context.row.id)
  context.updateRow({ status: 'approved' })
}
```

`index` 在异步结束后可能已过期。`updateRow` 会使用绑定的原行身份；配置唯一稳定的 rowKey 后，会在最新 `tableData` 中重新定位。目标已删除、rowKey 缺失或重复时忽略更新。

## 约束与空内容

- 未找到 `cellSlot` 对应的具名 Slot 时渲染空单元格。
- `cellSlot` 不与 `children` 混用，TypeScript 联合类型会拒绝该配置。
- `selection/index/expand` 使用 Element UI 原生 `props.type`，不与 `cellSlot` 混用。
- 固定列仍使用 `columns[].props.fixed`，其 DOM 复制行为遵循 Element UI。

## 完整示例

Playground [`/cell-slot`](http://localhost:5173/cell-slot) 同时演示：

- 组合信息单元格。
- 状态和派生金额。
- `updateRow` 和 `field-change`。
- 异步更新与 rowKey。
- 字段 Slot 的对照展示。
- 实际 `FormTableCellSlotContext` 检视面板。
