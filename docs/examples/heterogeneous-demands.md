# 多需求费用明细场景

> 可运行 Demo：[打开多需求费用明细调试页 ↗](http://localhost:5173/heterogeneous-demands)

该示例模拟从 jQuery DOM 渲染迁移到 Vue 的会务费用表。会场、酒店、用餐、机票、火车票、用车、其他和嘉宾共享相同的表格列，但每种需求拥有不同字段和交互组件。

## 为什么保留一个 FormTable

页面的“需求类型、需求说明、使用时间、数量/单价、总费用预算、操作”列语义稳定，变化只发生在单元格内部。因此示例保留一个 FormTable 和一套表头：

- FormTable 负责公共列、行定位、校验入口和受控数据更新。
- 场景组件负责需求说明区域的字段布局和内部交互。
- 页面负责新增同类明细、删除、分组维护、预算计算和提交转换。

如果拆成多个隐藏表头的 FormTable，会增加列宽同步、边框拼接、多表单校验聚合和重复实例开销。

## 差异字段的数据结构

公共数据保留在行对象，类型专属字段放入 `detail`：

```ts
interface DemandRow {
  _rowKey: string
  type: DemandType
  detail: DemandDetail
  schedule: DemandSchedule
  pricing: DemandPricing
}
```

例如酒店的 `detail` 包含酒店名称、房间名称、房间数量、床型、入住人数和早餐；机票的 `detail` 则包含舱位、出发城市和到达城市。不要把所有场景字段平铺为一个包含大量空值的对象。

## 简单配置与复杂组件并用

示例刻意展示两种处理方式：

- 会场、酒店、用餐、交通使用独立业务组件，并通过 `component.resolveRenderer` 和组件注册表按 `row.type` 选择。
- “其他”和“嘉宾”的结构简单，直接使用 FormTable Item 的 `visible` 和嵌套 `fieldKey`。

复杂业务组件使用受控协议：接收当前 `detail`，发生变化时发出新的对象。FormTable 根据配置的 `value/change` 模型协议写回字段，不需要页面 Slot 参与组件选择。组件不读取 DOM，也不把内部状态作为最终提交数据。

```ts
{
  fieldKey: 'detail',
  type: 'component',
  component: {
    resolveRenderer: ({ row }) => demandEditors[row.type],
    props: ({ row }) => ({ mode: row.type }),
    model: { prop: 'value', event: 'change' }
  }
}
```

## 需求类型是唯一分组

业务中每个需求类型只出现一个分组，因此类型列只展示文本，不提供行内切换。同一类型可以包含多条费用明细，但必须在数组中连续存放。

```ts
const nextRow = createDemandRow(currentRow.type)
rows.splice(lastIndexOfType + 1, 0, nextRow)
```

新增按钮会把新明细插入该类型分组末尾。类型列通过 `tableProps.spanMethod` 合并：分组首行返回实际 `rowspan`，其余被覆盖行返回 `{ rowspan: 0, colspan: 0 }`。跨度基于响应式行数据预先计算，渲染回调只读取数组。

## 提交阶段归一化

页面展示的 `_rowKey` 仅用于前端稳定定位，不提交给业务接口。校验成功后将每行转换为后端数据：

```ts
const payload = rows.map(row => ({
  demandType: row.type,
  demandTypeName: demandTypeLabels[row.type],
  detail: row.detail,
  schedule: requiresSchedule(row.type) ? row.schedule : undefined,
  pricing: row.pricing,
  totalBudget: calculateDemandTotal(row)
}))
```

预算是由数量和单价推导的计算结果。实际业务可以在提交前再次计算，避免信任页面中可能过期的派生值。

## 迁移时的边界

- 先定义 Vue 数据结构，再替换 jQuery 创建和查询 DOM 的逻辑。
- 每个需求实例对应一条带稳定 `_rowKey` 的行数据。
- 新增同类需求是数组插入，不是复制 DOM 节点。
- 新增或删除明细后，在 `nextTick` 中清理因数组下标变化产生的旧校验状态。
- 配置和组件注册表保持稳定，不要在每次输入时重新创建整套 columns。
- 如果组件需要异步查询，回调后通过 `setValue` 或 `updateRow` 更新最新业务行。

可运行源码位于 `playground/src/views/HeterogeneousDemandView.vue`，场景编辑器位于 `playground/src/components/demand-demo/`。
