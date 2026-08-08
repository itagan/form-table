# 公开类型

包入口导出：

- `ColumnConfig`、`RowConfig`、`FormItemConfig`
- `TypeFormItemConfig`、`CustomComponentFormItemConfig`、`SlotFormItemConfig`
- `FieldComponentConfig`、`FormItemType`、`FormItemOption`、`OptionPropsConfig`
- `TableRow`、`FormTableRecord`、`FormTableProps`
- `FormTableRuntimeContext`、`FormTableFieldContext`
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
