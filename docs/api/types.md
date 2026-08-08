# 公开类型

包入口导出：

- `ColumnConfig`、`RowConfig`、`FormItemConfig`
- `BuiltinFormItemConfig`、`ComponentFormItemConfig`、`SlotFormItemConfig`
- `FieldComponentConfig`、`BuiltinFormItemType`、`FormItemType`
- `FormItemOption`、`OptionPropsConfig`、`ResolvedComponentConfig`
- `TableRow`、`FormTableRecord`、`FormTableProps`
- `FormTableTableContext`、`FormTableRowContext`、`FormTableFieldRenderContext`
- `FormTableFieldContext`、`FormTableSlotContext`
- `FormTableFieldChangePayload`、`FormTableHeaderSlotContext`
- `FormTableExpose`、`FormTableElementFormRef`、`FormTableElementTableRef`

运行时入口只导出默认组件、`FormTable` 和 `FormTablePlugin`。上下文注入 key、内部更新 API、动态解析和渲染模式工具都不属于公共入口。

三种字段配置通过联合类型互斥：

```ts
type FormItemConfig =
  | BuiltinFormItemConfig
  | ComponentFormItemConfig
  | SlotFormItemConfig
```

`type` 明确决定模式，`component.renderer` 的类型随模式收窄：

```ts
interface ComponentFormItemConfig {
  type: 'component'
  component: FieldComponentConfig & {
    renderer: string | Component
  }
}

interface SlotFormItemConfig {
  type: 'slot'
  component: FieldComponentConfig & {
    renderer: string
  }
}
```

动态配置上下文按层级收敛：

```text
Column visible/props     → tableData
Row visible/props        → tableData, row, index
Field 动态配置           → tableData, row, index, fieldKey, value
component.listeners      → Field 信息 + setValue, updateRow
字段 slot                → Listener 信息 + propPath, component
```

`row` 和 `tableData` 在回调类型中采用浅层只读约束；运行时不会冻结原对象。字段更新使用 `setValue` 或 `updateRow`。

表头 slot 接收 `tableData/label/columnIndex/column`。其中 `column` 类型为 `Readonly<ColumnConfig>`；`columnIndex` 是动态显隐过滤后的可见列下标，不保证等于原始 `columns` 数组下标。
