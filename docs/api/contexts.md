# Slot 与上下文

上下文按渲染层级提供，不使用空对象或无效下标补齐不存在的字段。

## Slot 提供与命名约定

FormTable 的自定义 Slot 都引用父组件的具名 scoped Slot。配置项保存 Slot 名称，模板使用同名 `#name` 提供实现；TypeScript 可以约束配置结构，但不能检查模板中是否真的存在对应名称。

### 缺失时的行为

| Slot | 配置入口 | 提供要求 | 未提供同名模板时 |
| --- | --- | --- | --- |
| Table 空状态 | `#empty` | 可选 | 使用 Element Table 默认空状态 |
| Table 末尾 | `#append` | 可选 | 不渲染末尾内容 |
| 表头 | `columns[].headerSlot` | 可选 | 回退最终解析后的列标题 |
| 整格单元格 | `columns[].cellSlot` | 配置后应提供 | 当前列单元格为空 |
| 字段内容 | `type: 'slot'` + `component.slot` | 配置后必须提供 | 保留 FormItem，字段内容为空 |
| FormItem Label | `formItems[].labelSlot` | 可选 | 回退 `formItemProps.label` |
| FormItem Error | `formItems[].errorSlot` | 可选 | 回退 Element 默认错误内容 |

`cellSlot` 和字段 Slot 承担主体内容，配置后应始终提供同名模板。表头、Label 和 Error Slot 具有明确回退，可以按页面能力选择性提供。

### 推荐命名

Slot 名称统一推荐使用 kebab-case，并采用“业务标识 + 角色”的完整后缀，不使用 `head-*`、`column-*` 等缩写或仅描述结构的名称：

| 场景 | 推荐格式 | 示例 |
| --- | --- | --- |
| 表头 | `<column>-header` | `amount-header`、`contact-header` |
| 整格内容 | `<column>-cell` | `status-cell`、`summary-cell` |
| 行或业务操作 | `<business>-actions` | `row-actions`、`order-actions` |
| 字段编辑器 | `<field>-editor` | `score-editor`、`time-range-editor` |
| 字段选择器 | `<field>-select` / `<field>-picker` | `city-select`、`owner-picker` |
| FormItem Label | `<field>-label` | `amount-label` |
| FormItem Error | `<field>-error` | `amount-error` |

```ts
const columns = [{
  key: 'amount-column',
  label: '金额',
  headerSlot: 'amount-header',
  formItems: [{
    fieldKey: 'amount',
    type: 'slot',
    labelSlot: 'amount-label',
    errorSlot: 'amount-error',
    component: { slot: 'amount-editor' }
  }]
}, {
  key: 'actions-column',
  label: '操作',
  cellSlot: 'row-actions'
}]
```

所有自定义 Slot 共享 FormTable 的同一个具名 Slot 命名空间。相同上下文的多个字段可以有意复用 `money-editor` 等模板；表头、单元格、字段、Label 和 Error 上下文不同，不应意外使用同一个名称。`default`、`empty` 和 `append` 保留给 Vue/FormTable 根级语义，不用于自定义配置引用。

Slot 名称应保持稳定，不拼接行下标或当前字段值。需要区分动态列或重复字段时，继续使用 Column/Item 的稳定 `key` 管理渲染身份，Slot 名只描述模板职责。

## 上下文矩阵

| 使用位置 | 业务数据 | 原始配置 | 更新能力 | 解析结果 |
| --- | --- | --- | --- | --- |
| Column 动态配置 | `tableData` | `columnConfig` | — | — |
| `rowProps` 动态配置 | `tableData, row, index, displayIndex` | `columnConfig` | — | — |
| Item 动态配置 | 增加 `fieldKey, value` | 增加 `itemConfig` | — | — |
| component 动态配置 | Item 数据 | Item 配置 | — | — |
| `component.listeners[event]` | Item 数据 | Item 配置 | `setValue, setBindingValue, updateRow` | — |
| 字段 Slot | Item 数据 | Item 配置 | `setValue, setBindingValue, updateRow` | `propPath, component` |
| FormItem Label Slot | Item 数据 | Item 配置 | `setValue, setBindingValue, updateRow` | `propPath` |
| FormItem Error Slot | Item 数据 | Item 配置 | `setValue, setBindingValue, updateRow` | `propPath, error` |
| `cellSlot` | `row, index, displayIndex` | `columnConfig` | `updateRow` | — |
| 表头 Slot | `tableData, label, columnIndex` | `columnConfig` | — | — |

## 动态配置回调

| 回调路径 | 上下文 |
| --- | --- |
| `columns[].visible/props/headerProps/headerHint` | `FormTableColumnContext` |
| `columns[].rowProps` | `FormTableRowContext` |
| `columns[].formItems[].visible/colProps/formItemProps/hint` | `FormTableFieldRenderContext` |
| `...component.resolveComponent/props/options/optionProps` | `FormTableFieldRenderContext` |
| `...component.listeners[event]` | `FormTableFieldContext, ...原始事件参数` |

`cellSlot` 和表头 Slot 是 Vue scoped Slot，不是 `DynamicValue` 配置回调。

## FormTableCellSlotContext

| 字段 | 类型 | 时效 | 说明 |
| --- | --- | --- | --- |
| `row` | `Readonly<TableRow>` | 渲染快照 | 当前业务数据行 |
| `index` | `number` | 渲染快照 | 当前行在受控 `tableData` 中的数据源下标 |
| `displayIndex` | `number` | 渲染快照 | Element Table 排序或筛选后的显示下标 |
| `columnConfig` | `Readonly<CellSlotColumnConfig>` | 配置快照 | 当前列原始配置 |
| `updateRow` | `(patch: FormTableRowPatch<TableRow>) => void` | 绑定当前行 | 不可变更新当前行，patch key 支持嵌套路径 |

不提供：`tableData/columnIndex/fieldKey/value/setValue/itemConfig/propPath/component`。完整用法见 [`cellSlot` 专题](../features/cell-slot.md)。

## FormTableSlotContext

字段 Slot 保留完整字段语义：

| 分类 | 字段 |
| --- | --- |
| 数据 | `tableData, row, index, displayIndex, fieldKey, value, bindingValue` |
| 配置 | `columnConfig, itemConfig` |
| 更新 | `setValue, setBindingValue, updateRow` |
| 校验 / 解析 | `propPath, component` |

`itemConfig.component` 是未解析的原始配置；`component` 是当前行已解析的 `props/listeners/options/optionProps/model`。组件动态配置使用 `FormTableFieldRenderContext`，listener 在此基础上增加 `setValue/bindingValue/setBindingValue/updateRow`。未配置 `binding.map` 时，复合值助手等同于当前字段的 `value/setValue`；配置后按映射一次读写多个字段。

`itemConfig.meta` 是使用方声明的静态业务元数据，所有字段上下文都会保留同一个原始对象。多个字段可以复用同一个 Slot，并用 `meta` 表达业务角色而不是判断数据路径：

```ts
formItems: [
  {
    fieldKey: 'purchasePrice',
    type: 'slot',
    meta: { role: 'purchase', currency: 'CNY' },
    component: { slot: 'money-editor' }
  },
  {
    fieldKey: 'salePrice',
    type: 'slot',
    meta: { role: 'sale', currency: 'USD' },
    component: { slot: 'money-editor' }
  }
]
```

```vue
<template #money-editor="{ value, setValue, itemConfig }">
  <MoneyInput
    :value="value"
    :currency="itemConfig.meta.currency"
    @input="setValue"
  />
</template>
```

`meta` 不会复制到 Slot scope 顶层或 `component.props`；未配置时保持 `undefined`。

Item Hint 及 `hintOptions.field` formatter 都使用 `FormTableFieldRenderContext`。解析后的提示内容不进入组件动态配置回调或 listener；仅 `hintTrigger: 'content'` 的 title 模式会将其作为缺省 `component.props.title` 提供给实际组件或字段 Slot。

## FormItem Label / Error Slot 上下文

`labelSlot` 使用 `FormTableFormItemSlotContext`，包含完整字段数据、配置、`setValue/updateRow` 和 `propPath`。`errorSlot` 使用 `FormTableFormItemErrorSlotContext`，并额外增加 Element FormItem 当前的 `error: string`。正常数据行的 `propPath` 是完整字符串；同一行对象重复出现在 `tableData` 且排序后无法确定来源位置时为 `undefined`，FormTable 会停止为该字段绑定校验路径并在开发环境警告。

```vue
<template #amount-label="{ row, propPath }">
  <span>金额 · {{ row.currency }} · {{ propPath }}</span>
</template>

<template #amount-error="{ error }">
  <span class="business-error">{{ error }}</span>
</template>
```

自定义 Label 遵守 Element UI 原生 Slot 语义，不会自动拼接 `formProps.labelSuffix`。Error Slot 只在 Element FormItem 处于错误状态且允许展示消息时挂载。

## FormTableHeaderSlotContext

| 字段 | 说明 |
| --- | --- |
| `tableData` | 当前只读表数据 |
| `columnConfig` | 当前列原始配置 |
| `columnIndex` | 当前可见列下标 |
| `label` | 表头文本 |

## 快照与异步更新

`row/index/displayIndex/value` 表示触发或渲染当时的快照。`index` 对应受控 `tableData`，`displayIndex` 只表示当前屏幕位置。`setValue/updateRow` 会绑定当时的数据行。配置唯一稳定的 `rowKey` 后，异步调用会在最新 `tableData` 中重新定位原行；目标行已删除、rowKey 缺失或重复时忽略更新。

具体更新方式和事件结果见[数据更新与受控回写](../features/data-updates.md)，各类 key 的职责见[稳定身份与异步安全](../features/stable-identity.md)。
