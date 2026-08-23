# 公开类型

包入口导出：

- `ColumnConfig`、`LayoutColumnConfig`、`CellSlotColumnConfig`、`NativeColumnConfig`、`FormItemConfig`
- `FieldComponentConfig`、`FieldModelConfig`、`FieldComponentResolver`、`FieldBindingConfig`、`FieldBindingMapEntry`、`BuiltinFormItemType`
- `FieldTypeDefinition`、`TypedFieldTypeDefinition`、`FieldTypeRegistry`、`EmptyFieldTypeRegistry`、`FieldTypeEventMap`、`FieldTypeListeners`
- `FormItemOption`、`OptionPropsConfig`
- `FormTableHintValue`、`FormTableHintMode`、`FormTableHintTargets`、`FormTableHintTrigger`、`FormTableFieldHintFormatter`、`FormTableHintOptions`
- `TableRow`、`FormTableRecord`、`FormTableRowPatch`、`FormTableProps`、`FormTableRowKey`
- `FormTableTableProps`、`FormTableFormProps`、`FormTableFormItemProps`
- `FormTableColumnContext`、`FormTableRowContext`、`FormTableFieldRenderContext`
- `FormTableFieldContext`、`FormTableFormItemSlotContext`、`FormTableFormItemErrorSlotContext`
- `FormTableSlotContext`、`FormTableCellSlotContext`
- `FormTableFieldChangePayload`、`FormTableHeaderSlotContext`
- `FormTableElementColumn`、`FormTableSortChangePayload`、`FormTableFilterChangePayload`
- `FormTableExpose`、`FormTableElementFormRef`、`FormTableElementTableRef`
- `FormTableComponent`、`FormTableEmits`

运行时入口导出默认组件、具名 `FormTable`、泛型组件工厂 `createFormTable`、泛型配置助手 `defineFormTableColumns`、单项协议助手 `defineFormTableType` 和注册助手 `defineFormTableTypes`。上下文注入 key、内部更新 API、动态解析和渲染模式工具都不属于公共入口。

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
  formItems: [{
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

自定义字段 type 使用同一个注册表泛型贯穿组件和 columns：

```ts
const fieldTypes = defineFormTableTypes<PurchaseRow>()({
  employee: {
    is: EmployeePicker,
    model: { prop: 'selectedId', event: 'user-confirm' }
  }
})

const FormTable = createFormTable<PurchaseRow, typeof fieldTypes>()
const columns = defineFormTableColumns<PurchaseRow, typeof fieldTypes>([{
  label: '负责人',
  formItems: [{ fieldKey: 'employeeId', type: 'employee' }]
}])
```

需要让 Item Props 和业务事件获得精确提示时，先用 `defineFormTableType<TRow>()<TProps, TEvents>(definition)` 声明可选协议，再把返回值放入注册表。它在运行时原样返回对象；不使用该助手时，注册及渲染行为不变，Props/listener 保持兼容的宽松类型。

第二泛型默认 `EmptyFieldTypeRegistry`，因此旧代码无需修改。非空时 `FormTableProps<TRow, TFieldTypes>` 要求 `fieldTypes: TFieldTypes`，并让注册名称精确进入 Item 的 type 联合；错误名称或使用另一份注册表会在类型检查阶段被拒绝。

泛型组件与默认 FormTable 都推荐使用 `v-model="tableData"`。类型入口内部适配了 Vue 2 Volar 对无参数 `v-model` 的模板映射；这只是声明层适配，运行时仍由组件的 `model: { prop: 'tableData', event: 'update:tableData' }` 驱动。需要显式处理回写时仍可使用 `:table-data.sync` 或 `@update:tableData`。

`ColumnConfig`、Item 配置、上下文、listener、事件载荷与 `FormTableProps` 都接受默认行泛型；省略泛型时继续使用原有 `TableRow`。`fieldKey` 保持为字符串，以同时支持固定字段、嵌套对象与数组路径、服务端字段及其他动态配置。

根组件 Vue 2 `v-model` 映射到 `FormTableProps.tableData` 与 `update:tableData`，因此不会新增 `value` prop 或 `input` 事件。Item 的 `FieldComponentConfig.model` 只负责字段组件协议，与根组件 model 无关。

列配置通过联合类型互斥：

```ts
type ColumnConfig = LayoutColumnConfig | CellSlotColumnConfig | NativeColumnConfig
```

`LayoutColumnConfig` 使用 `formItems` 进入 Item 字段渲染链路，并可用 `rowProps` 配置单元格内默认采用 Flex 的唯一 Row；`CellSlotColumnConfig` 使用 `cellSlot` 直接渲染单元格；`NativeColumnConfig` 只透传 `el-table-column` props。三种列模式互斥。

```ts
interface CellSlotColumnConfig extends BaseColumnConfig {
  cellSlot: string
  formItems?: never
}

interface FormTableCellSlotContext {
  row: Readonly<TableRow>
  index: number
  columnConfig: Readonly<CellSlotColumnConfig>
  updateRow: (patch: FormTableRowPatch<TableRow>) => void
}
```

`BaseColumnConfig` 是内部的共用结构，不单独从包入口导出；它表示两种列共用的 `key/label/headerSlot/headerProps/headerHint/visible/props`。`FormTableCellSlotContext` 不继承字段上下文，因此不包含 `fieldKey/value/setValue/propPath/component`，也不会为不存在的字段语义提供空占位值。

`FormTableRowPatch<TRow>` 用于所有 `updateRow` 入口：已声明的顶层字段沿用 `Partial<TRow>` 的类型和拼写检查，同时额外接受 `profile.city`、`items[0].name` 等运行时字段路径。它不递归枚举业务类型，避免让动态 Schema 和深层数组类型显著增加 TypeScript 计算量。

字段配置通过联合类型互斥：

```ts
type FormItemConfig =
  | { type: BuiltinFormItemType; component?: FieldComponentConfig }
  | {
      type: keyof TFieldTypes
      component?: Pick<FieldComponentConfig, 'props' | 'listeners' | 'model'>
    }
  | {
      type: 'component'
      component: FieldComponentConfig & (
        | { is: string | Component; resolveComponent?: FieldComponentResolver }
        | { is?: never; resolveComponent: FieldComponentResolver }
      )
    }
  | { type: 'slot'; component: FieldComponentConfig & { slot: string } }
```

所有 Item 都支持可选 `key` 作为稳定渲染身份，并要求 `fieldKey` 指向行数据路径。`key` 不参与取值、更新或表单校验路径计算。注册 type 的 Item 只允许 `component.props/listeners/model`，实际组件 `is` 由注册定义提供。Item 还可通过 `labelSlot/errorSlot` 引用 FormTable 上的具名 Slot；两者都获得字段操作上下文和完整 `propPath`，Error Slot 额外获得 `error`。

三种 Item 也共享可选的静态 `meta: FormTableRecord`。FormTable 原样保留该对象但不解析或自动透传，动态配置、listener 和 Slot 通过 `itemConfig.meta` 读取。需要动态差异时应读取当前 `row/value` 或提供另一份 Item 配置，而不是把 `meta` 配置为函数。

`type` 明确决定模式。component 模式要求静态 `is` 或动态 `resolveComponent` 至少存在一个；slot 模式要求 `component.slot` 提供静态字符串名称：

```ts
interface ComponentItemShape {
  type: 'component'
  component: FieldComponentConfig & (
    | { is: string | Component; resolveComponent?: FieldComponentResolver }
    | { is?: never; resolveComponent: FieldComponentResolver }
  )
}

interface SlotItemShape {
  type: 'slot'
  component: FieldComponentConfig & {
    slot: string
  }
}
```

```ts
type FieldComponentResolver = (
  context: FormTableFieldRenderContext
) => string | Component | undefined
```

`is` 对应 Vue 动态组件目标，推荐使用组件对象或全局注册名；原生标签字符串的低层能力与限制见 [Component 配置](./component.md#is-目标与原生标签边界)。`resolveComponent` 返回 `undefined` 时回退到静态 `is`。它只在 component 模式使用，避免与 Vue 函数组件及具名 slot 解析产生歧义。

动态配置上下文按层级收敛：

```text
Column visible/props/headerProps/headerHint → tableData, columnConfig
Column rowProps          → Column 信息 + row, index
Field 布局与 Hint 求值   → Row 信息 + fieldKey, value, itemConfig
component 动态配置       → Field 信息
component.listeners      → Field 信息 + setValue, bindingValue, setBindingValue, updateRow
字段 slot                → Listener 信息 + propPath, component
列级 cellSlot            → row, index, columnConfig, updateRow
```

`FormTableSlotContext.itemConfig.component` 保留调用方传入的原始配置；`FormTableSlotContext.component` 包含针对当前数据行解析并归一化后的 `props/listeners/options/optionProps/model`，用于直接绑定 Slot 内组件。该解析结果不再作为独立顶层类型导出。

自定义组件绑定协议类型：

```ts
interface FieldModelConfig<TRow extends TableRow = TableRow> {
  prop?: string
  event?: string
  valueToProp?: (
    value: FormTableValue,
    context: FormTableFieldRenderContext<TRow>
  ) => FormTableValue
  valueFromEvent?: (...args: unknown[]) => FormTableValue
}
```

`FieldComponentConfig.model` 未配置时保留 Vue 2 原生 `v-model`；配置 `FieldModelConfig` 时使用指定 prop/event，并可通过 `valueToProp/valueFromEvent` 处理非对称值；配置 `false` 时不注入模型绑定。输入转换接收 `bindingValue` 和只读字段渲染上下文，保持同步且不承担副作用。

复合字段映射类型：

```ts
interface FieldBindingMapEntry {
  fieldPath: string
  valuePath: string
  fallbackValue?: FormTableValue
}

interface FieldBindingConfig {
  map: FieldBindingMapEntry[]
}
```

`fallbackValue` 仅在组件输出中无法解析 `valuePath` 时参与写回，不改变从 row 组装 `bindingValue` 的读取方向。`bindingValue/setBindingValue` 进入 `FormTableFieldContext` 及其 Slot 扩展上下文；主 `value/setValue` 始终保留单一 `fieldKey` 语义。完整规则见[复合字段映射](../features/composite-binding.md)。

`row/tableData` 与 `columnConfig/itemConfig` 在回调类型中采用浅层只读约束；运行时不会冻结原对象。字段更新使用 `setValue` 或 `updateRow`，配置调整由调用方替换 `columns`。

表头 slot 接收 `tableData/label/columnIndex/columnConfig`。`columnIndex` 是动态显隐过滤后的可见列下标，不保证等于原始 `columns` 数组下标。

`ColumnConfig.headerProps` 传给默认或 Slot 表头的 `.form-table-column-header`，可配置原生 `title`、class、style 和 aria 属性。存在 `column.props.renderHeader` 时由 Element UI 完全接管，FormTable 不包装也不应用 `headerProps/headerHint`。

`ColumnConfig.headerHint` 与 Item 的 `hint` 都只接受动态字符串或 `false/null/undefined`。Item 未声明、返回 `null` 或空字符串时继承 `FormTableHintOptions.field`，`false` 关闭，非空字符串覆盖；表头不继承字段 formatter。`targets` 排除的目标不会求值。解析后的 Hint 不进入组件回调或 listener；仅 `hintTrigger: 'content'` 的 title 模式会将其作为缺省 `component.props.title` 提供给实际组件或字段 Slot。
