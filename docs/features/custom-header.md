# 自定义表头

> 可运行 Demo：[复杂布局与三种渲染模式 ↗](http://localhost:5173/form-table-advanced)

`headerSlot` 适合表头文本后跟图标、必填标识、Tooltip、筛选入口或其他交互内容。它复用 Vue scoped Slot，不为每种表头样式增加新的 Schema 字段。

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
<FormTable :table-data="tableData" :columns="columns">
  <template #contact-header="{ label, columnConfig, header }">
    <span v-bind="header.props" class="header-content">
      <span class="required-mark">*</span>
      <span>{{ label }}</span>
      <el-tooltip :content="header.hint" placement="top">
        <i class="el-icon-question" aria-label="查看填写说明" />
      </el-tooltip>
    </span>
  </template>
</FormTable>
```

这里的 Tooltip 完全由页面创建。FormTable 只解析配置并返回 scope，不增加包装器或额外标签。

## Slot scope

```ts
interface FormTableHeaderSlotContext {
  tableData: ReadonlyArray<TableRow>
  columnConfig: Readonly<ColumnConfig>
  columnIndex: number
  label: string
  header: {
    props: Record<string, unknown>
    hint?: string | null
  }
}
```

| 字段 | 用途 |
| --- | --- |
| `label` | 当前表头文本 |
| `columnConfig` | 读取 key 或其他原始列配置 |
| `columnIndex` | 当前可见列下标，不保证等于原始数组下标 |
| `tableData` | 显示行数、汇总状态等只读信息 |
| `header.props` | 当前列已解析的 `headerProps` |
| `header.hint` | 当前列已解析的 `headerHint` |

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

Slot 中获得的是当前渲染已经解析好的 `header`，不要再次执行原始配置函数。

## 选择方式

| 需求 | 推荐入口 |
| --- | --- |
| 只有普通文本表头 | `columns[].label` |
| 普通文本悬停提示 | `columns[].headerHint` |
| 文本后跟图标或 Tooltip | `columns[].headerSlot` |
| 完全遵循 Element UI render-header 协议 | `columns[].props.renderHeader` |

`headerSlot` 与 `props.renderHeader` 都表示调用方接管表头，两者不要同时配置。Element UI 的 selection、index、expand 功能列表头继续遵循原生行为。
