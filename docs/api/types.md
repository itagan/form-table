# 公开类型

包入口导出：

- `ColumnConfig`、`RowConfig`、`FormItemConfig`
- `TypeFormItemConfig`、`CustomComponentFormItemConfig`、`SlotFormItemConfig`
- `FieldComponentConfig`、`FormItemType`、`FormItemOption`、`OptionPropsConfig`
- `TableRow`、`FormTableRecord`、`FormTableProps`
- `FormTableTableContext`、`FormTableRowContext`、`FormTableFieldRenderContext`
- `FormTableFieldContext`、`FormTableSlotContext`
- `FormTableFieldChangePayload`、`FormTableSlotContext`、`FormTableHeaderSlotContext`
- `FormTableExpose`、`FormTableElementFormRef`、`FormTableElementTableRef`

三种字段配置通过联合类型互斥：

```ts
type FormItemConfig =
  | TypeFormItemConfig
  | CustomComponentFormItemConfig
  | SlotFormItemConfig
```

因此 `type`、`component.is` 和 `slot` 不会同时出现在同一个合法字段配置中。

动态配置上下文按层级收敛：

```text
Column visible/props     → tableData
Row visible/props        → tableData, row, index
Field 动态配置           → tableData, row, index, fieldKey
component.listeners      → Field 信息 + value, setValue, updateRow
字段 slot                → Listener 信息 + propPath
```

`row` 和 `tableData` 在回调类型中是只读的；字段更新使用 `setValue` 或 `updateRow`。
