# 公开类型

包入口导出：

- `ColumnConfig`、`RowConfig`、`FormItemConfig`
- `TypeFormItemConfig`、`CustomComponentFormItemConfig`、`SlotFormItemConfig`
- `FieldComponentConfig`、`FormItemType`、`FormItemOption`、`OptionPropsConfig`
- `TableRow`、`FormTableRecord`、`FormTableProps`
- `FormTableTableContext`、`FormTableRowContext`、`FormTableFieldRenderContext`
- `FormTableFieldContext`、`FormTableSlotContext`
- `FormTableFieldChangePayload`、`FormTableHeaderSlotContext`
- `FormTableExpose`、`FormTableElementFormRef`、`FormTableElementTableRef`

运行时入口只导出默认组件、`FormTable` 和 `FormTablePlugin`。上下文注入 key、内部更新 API、动态解析和渲染模式工具都不属于公共入口。

三种字段配置通过联合类型互斥：

```ts
type FormItemConfig =
  | TypeFormItemConfig
  | CustomComponentFormItemConfig
  | SlotFormItemConfig
```

因此 `type`、`component.is` 和 `slot` 不会同时出现在同一个合法 TypeScript 配置中。运行时仍对普通 JavaScript 和远程 JSON 做确定性容错，优先级为 `slot > component.is > type > 字段值展示`。

动态配置上下文按层级收敛：

```text
Column visible/props     → tableData
Row visible/props        → tableData, row, index
Field 动态配置           → tableData, row, index, fieldKey
component.listeners      → Field 信息 + value, setValue, updateRow
字段 slot                → Listener 信息 + propPath
```

`row` 和 `tableData` 在回调类型中是只读的；字段更新使用 `setValue` 或 `updateRow`。
