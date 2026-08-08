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

时间、名称、城市和地点都是独立行字段：简单输入框和下拉框直接通过 FormTable 配置；时间范围、内部议程选择器与操作按钮通过插槽接入。

## 行操作边界

- 新增议程时插入当前日期分组末尾，并复制分组字段。
- 删除后重新生成当天的 `sequence`，每天至少保留一条议程。
- 上下移动只允许发生在同一天内部，保证相同 `dayId` 始终连续。
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
