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
  :hint-options="{ mode: 'tooltip', targets: 'all' }"
>
  <template #contact-header="{ label }">
    <span class="required-mark">*</span>
    <span>{{ label }}</span>
    <i class="el-icon-question" aria-hidden="true" />
  </template>
</FormTable>
```

FormTable 会在 Slot 外创建 `.form-table-column-header`。当 `targets` 为 `header` 或 `all` 时，`headerHint` 自动应用于该节点，并作为 title 或表级单实例 Tooltip 的锚点。`headerProps` 也由此外层节点统一应用。

## Slot scope

```ts
interface FormTableHeaderSlotContext {
  tableData: ReadonlyArray<TableRow>
  columnConfig: Readonly<ColumnConfig>
  columnIndex: number
  label: string
}
```

| 字段 | 用途 |
| --- | --- |
| `label` | 当前表头文本 |
| `columnConfig` | 读取 key 或其他原始列配置 |
| `columnIndex` | 当前可见列下标，不保证等于原始数组下标 |
| `tableData` | 显示行数、汇总状态等只读信息 |

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

`headerProps` 只负责外层包装节点，不进入 Slot scope。Slot 内部元素需要独立属性时，直接在 Slot 模板中配置。

Tooltip 模式会让托管 Hint 的表头包装节点默认获得 `tabindex="0"`。Slot 内已经包含按钮等可聚焦控件时，在 `headerProps` 中显式设置 `tabindex: -1`，由内部控件承担键盘入口。

需要表头 Slot 使用不同于字段的 Tooltip 属性时，将 FormTable 作用范围保持为 `targets: 'field'`，不要配置 `headerHint`，直接在 Slot 内使用 Element Tooltip：

```vue
<template #contact-header="{ label }">
  <span>{{ label }}</span>
  <el-tooltip content="自定义表头说明" placement="top-start">
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
