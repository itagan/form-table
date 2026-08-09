# 公开类型

包入口导出：

- `ColumnConfig`、`LayoutColumnConfig`、`CellSlotColumnConfig`、`RowConfig`、`FormItemConfig`
- `BuiltinFormItemConfig`、`ComponentFormItemConfig`、`SlotFormItemConfig`
- `FieldComponentConfig`、`FieldModelConfig`、`FieldRendererResolver`、`BuiltinFormItemType`、`FormItemType`
- `FormItemOption`、`OptionPropsConfig`、`ResolvedComponentConfig`、`ResolvedHeaderConfig`
- `TableRow`、`FormTableRecord`、`FormTableProps`
- `FormTableTableContext`、`FormTableColumnContext`、`FormTableRowContext`、`FormTableFieldRenderContext`
- `FormTableFieldContext`、`FormTableSlotContext`、`FormTableCellSlotContext`
- `FormTableFieldChangePayload`、`FormTableHeaderSlotContext`
- `FormTableExpose`、`FormTableElementFormRef`、`FormTableElementTableRef`

运行时入口只导出默认组件、`FormTable` 和 `FormTablePlugin`。上下文注入 key、内部更新 API、动态解析和渲染模式工具都不属于公共入口。

列配置通过联合类型互斥：

```ts
type ColumnConfig = LayoutColumnConfig | CellSlotColumnConfig
```

`LayoutColumnConfig` 使用 `children` 进入 Row/Item 字段渲染链路；`CellSlotColumnConfig` 使用 `cellSlot` 直接渲染单元格，不接受 `children`，也不需要 `fieldKey`。它的 Slot 上下文为 `row/index/columnConfig/updateRow`。

三种字段配置通过联合类型互斥：

```ts
type FormItemConfig =
  | BuiltinFormItemConfig
  | ComponentFormItemConfig
  | SlotFormItemConfig
```

三种 Item 都支持可选 `key` 作为稳定渲染身份，并要求 `fieldKey` 指向行数据路径。`key` 不参与取值、更新或表单校验路径计算。

`type` 明确决定模式。component 模式要求静态 `renderer` 或动态 `resolveRenderer` 至少存在一个；slot 模式只接受静态字符串名称：

```ts
interface ComponentFormItemConfig {
  type: 'component'
  component: FieldComponentConfig & (
    | { renderer: string | Component; resolveRenderer?: FieldRendererResolver }
    | { renderer?: never; resolveRenderer: FieldRendererResolver }
  )
}

interface SlotFormItemConfig {
  type: 'slot'
  component: FieldComponentConfig & {
    renderer: string
  }
}
```

```ts
type FieldRendererResolver = (
  context: FormTableFieldRenderContext
) => string | Component | undefined
```

`resolveRenderer` 返回 `undefined` 时回退到静态 `renderer`。它只在 component 模式使用，避免与 Vue 函数组件及具名 slot 解析产生歧义。

动态配置上下文按层级收敛：

```text
Column visible/props/headerProps/headerHint → tableData, columnConfig
Row visible/props        → Column 信息 + row, index, rowConfig
Field 动态配置           → Row 信息 + fieldKey, value, itemConfig
component.listeners      → Field 信息 + setValue, updateRow
字段 slot                → Listener 信息 + propPath, component
列级 cellSlot            → row, index, columnConfig, updateRow
```

`FormTableSlotContext.itemConfig.component` 保留调用方传入的原始配置；`FormTableSlotContext.component` 的类型是 `ResolvedComponentConfig`，包含针对当前数据行解析并归一化后的 `props/listeners/options/optionProps/model`，用于直接绑定 Slot 内组件。

自定义组件绑定协议类型：

```ts
interface FieldModelConfig {
  prop?: string
  event?: string
  valueFromEvent?: (...args: unknown[]) => FormTableValue
}
```

`FieldComponentConfig.model` 未配置或为 `true` 时保留 Vue 2 原生 `v-model`；配置 `FieldModelConfig` 时使用指定 prop/event；配置 `false` 时不注入模型绑定。

`row/tableData` 与 `columnConfig/rowConfig/itemConfig` 在回调类型中采用浅层只读约束；运行时不会冻结原对象。字段更新使用 `setValue` 或 `updateRow`，配置调整由调用方替换 `columns`。

表头 slot 接收 `tableData/label/columnIndex/columnConfig/header`。`columnIndex` 是动态显隐过滤后的可见列下标，不保证等于原始 `columns` 数组下标；`header` 包含已解析的 `props/hint`，供自定义表头自行绑定。

`ColumnConfig.headerProps` 传给默认表头文本节点，可配置原生 `title`、class、style 和 aria 属性。存在 `headerSlot` 或 `column.props.renderHeader` 时，自定义表头优先；具名 Slot 可从解析后的 `header.props/header.hint` 选择性绑定，原生 `renderHeader` 自行负责展示属性。

`ColumnConfig.headerHint` 和 Item 的 `hint` 当前接受字符串或动态返回字符串，分别作为默认表头文本节点与 `el-form-item` 的原生 title。空字符串不显示浏览器提示，`null/undefined` 移除提示；字符串语义为未来扩展 Tooltip 保持稳定。
