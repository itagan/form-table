# Slot 与上下文

上下文按渲染层级提供，不使用空对象或无效下标补齐不存在的字段。

## 上下文矩阵

| 使用位置 | 业务数据 | 原始配置 | 更新能力 | 解析结果 |
| --- | --- | --- | --- | --- |
| Column 动态配置 | `tableData` | `columnConfig` | — | — |
| Row 动态配置 | `tableData, row, index` | `columnConfig, rowConfig` | — | — |
| Item 动态配置 | 增加 `fieldKey, value` | 增加 `itemConfig` | — | — |
| component 动态配置 | Item 数据 | Item 配置 | — | `hint` |
| `component.listeners[event]` | Item 数据 | Item 配置 | `setValue, updateRow` | `hint` |
| 字段 Slot | Item 数据 | Item 配置 | `setValue, updateRow` | `propPath, component, hint` |
| `cellSlot` | `row, index` | `columnConfig` | `updateRow` | — |
| 表头 Slot | `tableData, label, columnIndex` | `columnConfig` | — | `header` |

## 动态配置回调

| 回调路径 | 上下文 |
| --- | --- |
| `columns[].visible/props/headerProps/headerHint` | `FormTableColumnContext` |
| `columns[].children[].visible/props` | `FormTableRowContext` |
| `columns[].children[].children[].visible/colProps/formItemProps/hint` | `FormTableFieldRenderContext` |
| `...component.resolveRenderer/props/options/optionProps` | `FormTableResolvedFieldContext` |
| `...component.listeners[event]` | `FormTableFieldContext, ...原始事件参数` |

`cellSlot` 和表头 Slot 是 Vue scoped Slot，不是 `DynamicValue` 配置回调。

## FormTableCellSlotContext

| 字段 | 类型 | 时效 | 说明 |
| --- | --- | --- | --- |
| `row` | `Readonly<TableRow>` | 渲染快照 | 当前业务数据行 |
| `index` | `number` | 渲染快照 | 当前渲染下标，不是异步结束后的实时下标 |
| `columnConfig` | `Readonly<CellSlotColumnConfig>` | 配置快照 | 当前列原始配置 |
| `updateRow` | `(patch: Partial<TableRow>) => void` | 绑定当前行 | 不可变更新当前行，patch key 支持嵌套路径 |

不提供：`tableData/columnIndex/fieldKey/value/setValue/rowConfig/itemConfig/propPath/component`。完整用法见 [`cellSlot` 专题](../features/cell-slot.md)。

## FormTableSlotContext

字段 Slot 保留完整字段语义：

| 分类 | 字段 |
| --- | --- |
| 数据 | `tableData, row, index, fieldKey, value` |
| 配置 | `columnConfig, rowConfig, itemConfig` |
| 更新 | `setValue, updateRow` |
| 校验 / 解析 | `propPath, component, hint` |

`itemConfig.component` 是未解析的原始配置；`component` 是当前行已解析的 `props/listeners/options/optionProps/model`。`hint` 是标准化后的 `{ content, ownership }` 或 `null`；`ownership: 'custom'` 时 FormTable 不应用提示，Slot 可自行消费内容。

`component.resolveRenderer/props/options/optionProps` 和组件 listener 同样获得标准化后的 `hint`。Hint 自身的动态函数使用不含 `hint` 的基础字段上下文，避免配置引用自身。

Item 配置 `hint: true` 时，`hintOptions.fieldFormatter` 获得同一份基础 `FormTableFieldRenderContext`。formatter 在 component 解析前执行，因此不包含标准化 `hint`、`setValue/updateRow` 或解析后的 component 配置。

## FormTableHeaderSlotContext

| 字段 | 说明 |
| --- | --- |
| `tableData` | 当前只读表数据 |
| `columnConfig` | 当前列原始配置 |
| `columnIndex` | 当前可见列下标 |
| `label` | 表头文本 |
| `header.props` | 已解析表头属性，已由 FormTable 包装节点应用 |
| `header.hint` | 标准化后的 `{ content, ownership }` 或 `null`；仅 `ownership: 'table'` 自动应用 |

## 快照与异步更新

`row/index/value` 表示触发或渲染当时的快照。`setValue/updateRow` 会绑定当时的数据行。配置唯一稳定的 `tableProps.rowKey` 后，异步调用会在最新 `tableData` 中重新定位原行；目标行已删除、rowKey 缺失或重复时忽略更新。

具体更新方式和事件结果见[数据更新与受控回写](../features/data-updates.md)，各类 key 的职责见[稳定身份与异步安全](../features/stable-identity.md)。
