# 公开类型

包入口导出：

- `ColumnConfig`、`LayoutColumnConfig`、`CellSlotColumnConfig`、`NativeColumnConfig`、`FormItemConfig`
- `FieldComponentConfig`、`FieldModelConfig`、`FieldRendererResolver`、`BuiltinFormItemType`
- `FormItemOption`、`OptionPropsConfig`
- `FormTableHintValue`、`FormTableHintMode`、`FormTableHintTargets`、`FormTableFieldHintFormatter`、`FormTableHintOptions`
- `TableRow`、`FormTableRecord`、`FormTableProps`、`FormTableRowKey`、`FormTableTableProps`
- `FormTableColumnContext`、`FormTableRowContext`、`FormTableFieldRenderContext`
- `FormTableFieldContext`、`FormTableFormItemSlotContext`、`FormTableFormItemErrorSlotContext`
- `FormTableSlotContext`、`FormTableCellSlotContext`
- `FormTableFieldChangePayload`、`FormTableHeaderSlotContext`
- `FormTableElementColumn`、`FormTableSortChangePayload`、`FormTableFilterChangePayload`
- `FormTableExpose`、`FormTableElementFormRef`、`FormTableElementTableRef`
- `FormTableComponent`、`FormTableEmits`

运行时入口导出默认组件、`FormTable`、`FormTablePlugin`、泛型组件工厂 `createFormTable` 和泛型配置助手 `defineFormTableColumns`。上下文注入 key、内部更新 API、动态解析和渲染模式工具都不属于公共入口。

需要让组件 Props、事件和动态配置回调使用同一个业务行类型时，组合两个泛型入口：

```ts
import { createFormTable, defineFormTableColumns, type TableRow } from '@itagan/form-table'

interface PurchaseRow extends TableRow {
  id: string
  name: string
  amount: number
}

const FormTable = createFormTable<PurchaseRow>()
const columns = defineFormTableColumns<PurchaseRow>([{
  label: '采购信息',
  visible: ({ tableData }) => tableData.some(row => row.amount > 0),
  children: [{
    fieldKey: 'amount',
    type: 'number',
    component: {
      props: ({ row }) => ({ disabled: row.amount <= 0 })
    }
  }]
}])
```

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :row-key="row => row.id"
/>
```

`createFormTable<TRow>()` 只把同一个 FormTable 运行时对象转换为 `FormTableComponent<TRow>`，不会创建包装组件或额外实例；它负责约束 `v-model/tableData/columns/rowKey` 以及 `update:tableData/field-change`。`defineFormTableColumns<TRow>()` 原样返回数组，负责让 Column、Item 及其动态上下文获得 `TRow`。

泛型组件与默认 FormTable 都推荐使用 `v-model="tableData"`。类型入口内部适配了 Vue 2 Volar 对无参数 `v-model` 的模板映射；这只是声明层适配，运行时仍由组件的 `model: { prop: 'tableData', event: 'update:tableData' }` 驱动。需要显式处理回写时仍可使用 `:table-data.sync` 或 `@update:tableData`。

`ColumnConfig`、Item 配置、上下文、listener、事件载荷与 `FormTableProps` 都接受默认行泛型；省略泛型时继续使用原有 `TableRow`。`fieldKey` 保持为字符串，以同时支持固定字段、嵌套对象与数组路径、服务端字段及其他动态配置。

根组件 Vue 2 `v-model` 映射到 `FormTableProps.tableData` 与 `update:tableData`，因此不会新增 `value` prop 或 `input` 事件。Item 的 `FieldComponentConfig.model` 只负责字段组件协议，与根组件 model 无关。

列配置通过联合类型互斥：

```ts
type ColumnConfig = LayoutColumnConfig | CellSlotColumnConfig | NativeColumnConfig
```

`LayoutColumnConfig` 使用 `children` 进入 Item 字段渲染链路，并可用 `rowProps` 配置单元格内唯一 Flex Row；`CellSlotColumnConfig` 使用 `cellSlot` 直接渲染单元格；`NativeColumnConfig` 只透传 `el-table-column` props。三种列模式互斥。

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
  | { type: BuiltinFormItemType; component?: FieldComponentConfig }
  | {
      type: 'component'
      component: FieldComponentConfig & (
        | { renderer: string | Component; resolveRenderer?: FieldRendererResolver }
        | { renderer?: never; resolveRenderer: FieldRendererResolver }
      )
    }
  | { type: 'slot'; component: FieldComponentConfig & { renderer: string } }
```

三种 Item 都支持可选 `key` 作为稳定渲染身份，并要求 `fieldKey` 指向行数据路径。`key` 不参与取值、更新或表单校验路径计算。Item 还可通过 `labelSlot/errorSlot` 引用 FormTable 上的具名 Slot；两者都获得字段操作上下文和完整 `propPath`，Error Slot 额外获得 `error`。

`type` 明确决定模式。component 模式要求静态 `renderer` 或动态 `resolveRenderer` 至少存在一个；slot 模式只接受静态字符串名称：

```ts
interface ComponentItemShape {
  type: 'component'
  component: FieldComponentConfig & (
    | { renderer: string | Component; resolveRenderer?: FieldRendererResolver }
    | { renderer?: never; resolveRenderer: FieldRendererResolver }
  )
}

interface SlotItemShape {
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
Column rowProps          → Column 信息 + row, index
Field 布局与 Hint 求值   → Row 信息 + fieldKey, value, itemConfig
component 动态配置       → Field 信息
component.listeners      → Field 信息 + setValue, updateRow
字段 slot                → Listener 信息 + propPath, component
列级 cellSlot            → row, index, columnConfig, updateRow
```

`FormTableSlotContext.itemConfig.component` 保留调用方传入的原始配置；`FormTableSlotContext.component` 包含针对当前数据行解析并归一化后的 `props/listeners/options/optionProps/model`，用于直接绑定 Slot 内组件。该解析结果不再作为独立顶层类型导出。

自定义组件绑定协议类型：

```ts
interface FieldModelConfig {
  prop?: string
  event?: string
  valueFromEvent?: (...args: unknown[]) => FormTableValue
}
```

`FieldComponentConfig.model` 未配置时保留 Vue 2 原生 `v-model`；配置 `FieldModelConfig` 时使用指定 prop/event；配置 `false` 时不注入模型绑定。

`row/tableData` 与 `columnConfig/itemConfig` 在回调类型中采用浅层只读约束；运行时不会冻结原对象。字段更新使用 `setValue` 或 `updateRow`，配置调整由调用方替换 `columns`。

表头 slot 接收 `tableData/label/columnIndex/columnConfig`。`columnIndex` 是动态显隐过滤后的可见列下标，不保证等于原始 `columns` 数组下标。

`ColumnConfig.headerProps` 传给默认或 Slot 表头的 `.form-table-column-header`，可配置原生 `title`、class、style 和 aria 属性。存在 `column.props.renderHeader` 时由 Element UI 完全接管，FormTable 不包装也不应用 `headerProps/headerHint`。

`ColumnConfig.headerHint` 与 Item 的 `hint` 都只接受动态字符串或 `false/null/undefined`。Item 未声明、返回 `null` 或空字符串时继承 `FormTableHintOptions.field`，`false` 关闭，非空字符串覆盖；表头不继承字段 formatter。`targets` 排除的目标不会求值，解析后的 Hint 只由 FormTable 内部展示，不进入组件回调、listener 或 Slot 上下文。
