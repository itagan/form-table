# 公开类型

包入口导出：

- `ColumnConfig`、`LayoutColumnConfig`、`CellSlotColumnConfig`、`RowConfig`、`FormItemConfig`
- `BuiltinFormItemConfig`、`ComponentFormItemConfig`、`SlotFormItemConfig`
- `FieldComponentConfig`、`FieldModelConfig`、`FieldRendererResolver`、`BuiltinFormItemType`、`FormItemType`
- `FormItemOption`、`OptionPropsConfig`、`ResolvedComponentConfig`、`ResolvedHeaderConfig`
- `FormTableHint`、`FormTableFieldHint`、`FormTableHintConfig`、`FormTableFieldHintFormatter`、`ResolvedFormTableHint`、`FormTableHintOptions`
- `TableRow`、`FormTableRecord`、`FormTableProps`
- `FormTableTableContext`、`FormTableColumnContext`、`FormTableRowContext`、`FormTableFieldRenderContext`
- `FormTableResolvedFieldContext`、`FormTableFieldContext`、`FormTableSlotContext`、`FormTableCellSlotContext`
- `FormTableFieldChangePayload`、`FormTableHeaderSlotContext`
- `FormTableExpose`、`FormTableElementFormRef`、`FormTableElementTableRef`

运行时入口导出默认组件、`FormTable`、`FormTablePlugin` 和泛型配置助手 `defineFormTableColumns`。上下文注入 key、内部更新 API、动态解析和渲染模式工具都不属于公共入口。

需要让动态配置回调获得业务行类型时，使用运行时原样返回数组的泛型助手：

```ts
import { defineFormTableColumns, type TableRow } from '@itagan/form-table'

interface PurchaseRow extends TableRow {
  name: string
  amount: number
}

const columns = defineFormTableColumns<PurchaseRow>([{
  label: '采购信息',
  visible: ({ tableData }) => tableData.some(row => row.amount > 0),
  children: [{
    children: [{
      fieldKey: 'amount',
      type: 'number',
      component: {
        props: ({ row }) => ({ disabled: row.amount <= 0 })
      }
    }]
  }]
}])
```

`ColumnConfig`、Row/Item 配置、上下文、listener、事件载荷与 `FormTableProps` 都接受默认行泛型；省略泛型时继续使用原有 `TableRow`。`fieldKey` 仍是字符串，不执行类型级嵌套路径推导。

根组件 Vue 2 `v-model` 映射到 `FormTableProps.tableData` 与 `update:tableData`，因此不会新增 `value` prop 或 `input` 事件。Item 的 `FieldComponentConfig.model` 只负责字段组件协议，与根组件 model 无关。

列配置通过联合类型互斥：

```ts
type ColumnConfig = LayoutColumnConfig | CellSlotColumnConfig
```

`LayoutColumnConfig` 使用 `children` 进入 Row/Item 字段渲染链路；`CellSlotColumnConfig` 使用 `cellSlot` 直接渲染单元格，不接受 `children`，也不需要 `fieldKey`。

```ts
interface CellSlotColumnConfig extends BaseColumnConfig {
  cellSlot: string
  children?: never
}

interface FormTableCellSlotContext {
  row: Readonly<TableRow>
  index: number
  columnConfig: Readonly<CellSlotColumnConfig>
  updateRow: (patch: Partial<TableRow>) => void
}
```

`BaseColumnConfig` 是内部的共用结构，不单独从包入口导出；它表示两种列共用的 `key/label/headerSlot/headerProps/headerHint/visible/props`。`FormTableCellSlotContext` 不继承字段上下文，因此不包含 `fieldKey/value/setValue/propPath/component`，也不会为不存在的字段语义提供空占位值。

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
  context: FormTableResolvedFieldContext
) => string | Component | undefined
```

`resolveRenderer` 返回 `undefined` 时回退到静态 `renderer`。它只在 component 模式使用，避免与 Vue 函数组件及具名 slot 解析产生歧义。

动态配置上下文按层级收敛：

```text
Column visible/props/headerProps/headerHint → tableData, columnConfig
Row visible/props        → Column 信息 + row, index, rowConfig
Field 布局与 Hint 求值   → Row 信息 + fieldKey, value, itemConfig
component 动态配置       → Field 信息 + 标准化 hint
component.listeners      → Resolved Field 信息 + setValue, updateRow
字段 slot                → Listener 信息 + propPath, component
列级 cellSlot            → row, index, columnConfig, updateRow
```

`FormTableSlotContext.itemConfig.component` 保留调用方传入的原始配置；`FormTableSlotContext.component` 的类型是 `ResolvedComponentConfig`，包含针对当前数据行解析并归一化后的 `props/listeners/options/optionProps/model`，用于直接绑定 Slot 内组件。`FormTableSlotContext.hint` 是标准化后的 `ResolvedFormTableHint | null`。

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

表头 slot 接收 `tableData/label/columnIndex/columnConfig/header`。`columnIndex` 是动态显隐过滤后的可见列下标，不保证等于原始 `columns` 数组下标；`header.props` 是已解析属性，`header.hint` 是 `ResolvedFormTableHint | null`。只有 `ownership: 'table'` 的 Hint 会由统一包装节点自动应用。

`ColumnConfig.headerProps` 传给默认或 Slot 表头的 `.form-table-column-header`，可配置原生 `title`、class、style 和 aria 属性。存在 `column.props.renderHeader` 时由 Element UI 完全接管，FormTable 不包装也不应用 `headerProps/headerHint`。

`ColumnConfig.headerHint` 接受显式 `FormTableHint`；Item 的 `hint` 使用 `FormTableFieldHint`，额外支持 `true`。字符串会标准化为 `{ content, ownership: 'table' }`，对象缺省 `ownership` 时也由 FormTable 托管；`hint: true` 使用 `FormTableHintOptions.fieldFormatter`，未配置 formatter 时对当前值执行内置字符串转换。显式 Hint 不经过 formatter。字段 component 动态配置、listener、字段 Slot 与表头 Slot 均可读取标准化结果；空字符串、`null/undefined` 不产生自动提示。
