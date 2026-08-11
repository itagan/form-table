# 自定义表头

> 可运行 Demo：[Hint 展示策略与自定义渲染 ↗](http://localhost:5173/hint-scenarios)

`headerSlot` 适合表头文本后跟图标、必填标识、筛选入口或其他视觉内容。它复用 Vue scoped Slot，不为每种表头样式增加新的 Schema 字段；`headerHint` 的展示仍由 FormTable 统一处理。

## 配置示例

```ts
const columns: ColumnConfig[] = [{
  key: 'contact-column',
  label: '联系人信息',
  headerSlot: 'contact-header',
  headerHint: '姓名和手机号至少填写一项',
  headerProps: {
    class: 'contact-header',
    'aria-label': '联系人信息说明'
  },
  props: { minWidth: 420 },
  children: [/* Row / Item 配置 */]
}]
```

## 使用示例

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :hint-options="{ mode: 'tooltip' }"
>
  <template #contact-header="{ label }">
    <span class="required-mark">*</span>
    <span>{{ label }}</span>
    <i class="el-icon-question" aria-hidden="true" />
  </template>
</FormTable>
```

FormTable 会在 Slot 外创建 `.form-table-column-header`。默认的 `headerHint` 自动应用于该节点，并作为 title 或表级单实例 Tooltip 的锚点。Slot 不要重复绑定 `header.props`；需要自行展示时可配置 `headerHint: { content, auto: false }`，并读取 `header.hint.content`。

## Slot scope

```ts
interface FormTableHeaderSlotContext {
  tableData: ReadonlyArray<TableRow>
  columnConfig: Readonly<ColumnConfig>
  columnIndex: number
  label: string
  header: {
    props: Record<string, unknown>
    hint: ResolvedFormTableHint | null
  }
}
```

| 字段 | 用途 |
| --- | --- |
| `label` | 当前表头文本 |
| `columnConfig` | 读取 key 或其他原始列配置 |
| `columnIndex` | 当前可见列下标，不保证等于原始数组下标 |
| `tableData` | 显示行数、汇总状态等只读信息 |
| `header.props` | 当前列已解析的 `headerProps`，供读取兼容，已由包装节点应用 |
| `header.hint` | 标准化后的 `{ content, auto }` 或 `null`；仅 `auto: true` 由包装节点自动应用 |

## 动态配置

`headerProps/headerHint` 接收 ColumnContext，可以继续随表格数据变化：

```ts
headerHint: ({ tableData }) =>
  tableData.length > 0
    ? `当前 ${tableData.length} 条联系人记录`
    : '暂无联系人记录',
headerProps: ({ columnConfig }) => ({
  'data-column-key': columnConfig.key
})
```

Slot 中获得的是当前渲染已经解析好的 `header`；不要再次执行原始配置函数，也不要把 `header.props` 重复绑定到 Slot 内容。`header.hint` 始终是标准对象或 `null`。

需要表头 Slot 自行控制 Tooltip 时：

```ts
headerHint: { content: '自定义表头说明', auto: false }
```

```vue
<template #contact-header="{ label, header }">
  <span>{{ label }}</span>
  <el-tooltip :content="header.hint.content">
    <i class="el-icon-question" aria-label="查看表头说明" />
  </el-tooltip>
</template>
```

## 选择方式

| 需求 | 推荐入口 |
| --- | --- |
| 只有普通文本表头 | `columns[].label` |
| 普通文本悬停提示 | `columns[].headerHint` |
| 文本后跟图标或其他视觉内容 | `columns[].headerSlot` |
| 完全遵循 Element UI render-header 协议 | `columns[].props.renderHeader` |

`headerSlot` 只接管包装节点内部内容；`props.renderHeader` 则表示 Element UI 完全接管表头，两者不要同时配置。使用 `renderHeader` 时 FormTable 不自动应用 `headerHint/headerProps`。Element UI 的 selection、index、expand 功能列表头继续遵循原生行为。

## 相关 API

[Column / Row / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md)
