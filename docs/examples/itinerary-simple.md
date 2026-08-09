# 多日议程编排

这是一个较简单的业务 Demo，对应 Playground 的[可运行页面](http://localhost:5173/itinerary-simple)。它适合日期下面有多条明细，并且日期、主题等分组字段只希望显示一次的场景。

## 数据结构

表格仍使用平铺行数据。同一天的行使用相同 `dayId` 并连续排列；`dateLabel` 和 `topic` 在同组行中保持相同，便于校验、移动和提交。

```ts
interface ItineraryRow {
  _rowKey: string
  dayId: string
  dateLabel: string
  topic: string
  sequence: number
  timeRange: string[]
  name: string
  city: string
  location: string
}
```

## 合并字段如何编辑

Element UI 合并单元格后，只会挂载分组首行的内容。因此日期和主题使用业务插槽渲染；用户修改组首值时，调用方按 `dayId` 同步更新整组，而不是只修改第一条数据。

```ts
const updateGroupField = (target, field, value) => {
  tableData.value = tableData.value.map(row => (
    row.dayId === target.dayId ? { ...row, [field]: value } : row
  ))
}
```

时间、名称、城市和地点都是独立行字段：简单输入框和下拉框直接通过 FormTable 配置；时间范围和内部议程选择器使用字段 Slot。议程序号与操作按钮不参与表单字段绑定，使用列级 `cellSlot`，不再为它们配置虚拟 `fieldKey`。

```ts
{
  key: 'sequence-column',
  label: '议程',
  cellSlot: 'sequence-label'
},
{
  key: 'action-column',
  label: '操作',
  cellSlot: 'row-actions'
}
```

## 使用外部库拖拽排序

Demo 只在 Playground 中依赖 `sortablejs`，FormTable 包本身不增加拖拽依赖。页面通过 `getTableRef()` 获取 Element UI 表格根元素，再把 SortableJS 绑定到非固定列的主表体：

```ts
const tableElement = formTableRef.value?.getTableRef()?.$el
const tableBody = tableElement?.querySelector(
  '.el-table__body-wrapper > table > tbody'
)

sortableInstance = Sortable.create(tableBody, {
  handle: '.itinerary-drag-handle',
  draggable: 'tr',
  forceFallback: true,
  filter: 'input, textarea, button, .el-select',
  onMove: event => (
    event.dragged.dataset.dayId === event.related.dataset.dayId
  ),
  onEnd: event => applyDragResult(event.oldIndex, event.newIndex)
})
```

示例启用 `forceFallback`，让鼠标、触屏和自动化环境使用一致的拖动实现。

拖拽手柄位于非固定的“议程”列。Element UI 固定列会复制一份表体 DOM，如果将 Sortable 绑定到固定列副本，视觉顺序和真实数据容易不同步。

`onMove` 根据写入表格行的 `data-day-id` 阻止跨日期移动；`onEnd` 仍会再次校验源行和目标行，避免异常 DOM 事件破坏分组。组件卸载时调用 `destroy()` 清理外部监听器。

## 行操作边界

- 新增议程时插入当前日期分组末尾，并复制分组字段。
- 删除后重新生成当天的 `sequence`，每天至少保留一条议程。
- 上下移动只允许发生在同一天内部，保证相同 `dayId` 始终连续。
- 拖拽和上下移动使用相同的组内排序规则；按钮同时作为键盘操作和兼容性兜底。
- `spanMethod` 使用预计算跨度，渲染期间不重复遍历数据。

## 提交结构

页面编辑使用适合表格渲染的平铺结构，提交时再按 `dayId` 转为接口常见的嵌套结构：

```ts
[
  {
    dayId: 'day-1',
    dateLabel: '第一天',
    topic: '产品与团队共创',
    itineraries: [
      { sequence: 1, timeRange: ['09:00', '10:30'], name: '产品战略分享' }
    ]
  }
]
```

完整实现请查看 `playground/src/views/ItinerarySimpleView.vue`。
