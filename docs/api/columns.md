# Column / Item

## 路径关系

```text
columns[]                                  ColumnConfig
├─ props only                            NativeColumnConfig
├─ formItems[]                           FormItemConfig
│  └─ component                     FieldComponentConfig
└─ cellSlot                              列级单元格 Slot
```

`NativeColumnConfig`、`formItems[]` 和 `cellSlot` 是三条互斥路径。纯 Element Column 只提供 `props`；字段列使用 `formItems[]`；不需要字段路径和校验的自定义单元格可使用 [`cellSlot`](../features/cell-slot.md)。

> **能力边界：**当前 FormTable 不支持嵌套 `el-table-column` 形成的多级表头。`columns[].formItems` 表示单元格内的表单字段，旧字段列表名 `children` 不再接受，并为未来子列语义保留；`headerSlot` 只能自定义单个表头单元格的内容，不提供跨列分组或多行层级能力。当前替代方案见 [Element UI 能力边界](../features/element-ui-boundaries.md#多级表头)。

## ColumnConfig

| 配置路径 | 类型 | 必填 / 默认值 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].key` | `string` | 可选 | — | 列的稳定渲染身份 |
| `columns[].label` | `string` | 必填 | — | `el-table-column.label` |
| `columns[].visible` | `DynamicValue<boolean, ColumnContext>` | `true` | `tableData, columnConfig` | 是否渲染列 |
| `columns[].props` | `DynamicValue<ComponentProps, ColumnContext>` | `{}` | `tableData, columnConfig` | 透传 `el-table-column` |
| `columns[].headerSlot` | `string` | 可选 | Slot scope | 表头具名 Slot |
| `columns[].headerProps` | `DynamicValue<ComponentProps, ColumnContext>` | `{}` | `tableData, columnConfig` | 默认或 Slot 表头包装节点属性 |
| `columns[].headerHint` | `DynamicValue<FormTableHintValue, ColumnContext>` | 可选 | `tableData, columnConfig` | 表头 Hint；仅在 `targets: 'header'/'all'` 时求值和展示 |
| `columns[].rowProps` | `DynamicValue<ComponentProps, RowContext>` | `{}` | ColumnContext + `row, index` | 透传单元格内唯一 `el-row`；`type` 始终为 `flex` |
| `columns[].formItems` | `FormItemConfig[]` | 与 `cellSlot` 互斥 | — | 进入 Item 字段链路 |
| `columns[].cellSlot` | `string` | 与 `formItems` 互斥 | `row, index, columnConfig, updateRow` | 直接渲染单元格 |

无需字段渲染链路的功能列使用 `NativeColumnConfig`，所有 Element Column 属性继续放在 `props` 中：

```ts
{ props: { type: 'selection', width: 48 } }
{ label: '序号', props: { type: 'index', width: 64 } }
```

纯透传列的 `props` 必填、`label` 可选，且不接受 `formItems/cellSlot/headerSlot/headerProps/headerHint`。选择事件、序号函数和动态配置见[Element 功能列透传](../features/native-columns.md)。

## FormItemConfig

| 配置路径 | 类型 | 必填 / 默认值 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].formItems[].key` | `string` | 可选 | — | Item 稳定渲染身份 |
| `columns[].formItems[].fieldKey` | `string` | 必填 | — | 行数据路径，支持 `profile.city`、`items[0].name` |
| `columns[].formItems[].type` | `BuiltinFormItemType \| 'component' \| 'slot'` | 必填 | — | 字段渲染模式 |
| `columns[].formItems[].labelSlot` | `string` | 可选 | FormItem Slot scope | 自定义 `el-form-item` Label |
| `columns[].formItems[].errorSlot` | `string` | 可选 | Error Slot scope | 自定义校验错误内容 |
| `columns[].formItems[].visible` | `DynamicValue<boolean, ItemContext>` | `true` | RowContext + `fieldKey, value, itemConfig` | 字段显隐 |
| `columns[].formItems[].colProps` | `DynamicValue<ComponentProps, ItemContext>` | `{ span: 24 }` | ItemContext | 透传 `el-col` |
| `columns[].formItems[].formItemProps` | `DynamicValue<FormTableFormItemProps, ItemContext>` | `{}` | ItemContext | 透传 `el-form-item`；不接受内部管理的 `prop` |
| `columns[].formItems[].formItemProps.rules` | Element UI Rule(s) | 可选 | Element UI | 字段校验规则 |
| `columns[].formItems[].hint` | `DynamicValue<FormTableHintValue, ItemContext>` | 可选 | ItemContext | 未声明或空值继承全局，`false` 关闭，非空字符串覆盖 |
| `columns[].formItems[].component` | `FieldComponentConfig` | 按 `type` 决定 | ItemContext | 字段组件、Slot 和绑定配置 |

每个字段单元格固定只渲染一个可换行的 Flex `el-row`。每个 Item 对应一个 `el-col`，`span` 默认为 24；多个 Item 可按 24 栅格总和自然换行。非规则的多 Row 布局使用 [`cellSlot`](../features/cell-slot.md) 手写。

## 校验路径

Item 的 `fieldKey` 会自动转换为 Element UI 表单路径：

```text
fieldKey: profile.city
propPath: tableData.0.profile.city
```

`el-form-item.prop` 原本用于指向 `el-form.model` 中参与校验、清理和重置的字段。FormTable 根据当前行下标和 `fieldKey` 自动生成完整路径，确保每一行的同名字段拥有独立校验状态，并与字段更新目标一致。

因此，`prop` 不属于 `formItemProps` 的透传范围。TypeScript 会拒绝手工配置；JavaScript 或远程 Schema 即使传入，也会被 FormTable 生成的路径覆盖。需要调用原生 `validateField/clearValidate` 时，应使用 `tableData.{rowIndex}.{fieldKey}` 形式的完整路径。

`labelSlot/errorSlot` 按名称查找 FormTable 父组件的具名 scoped Slot。只有对应 Slot 实际存在时才会接管 Element FormItem 的同名 Slot；配置名称缺失时保留 `formItemProps.label/error` 和 Element 默认错误展示。Error Slot 仍遵守 `showMessage/inlineMessage` 与当前校验状态。

## 独立功能示例

| 配置路径 | 配置与使用示例 |
| --- | --- |
| 纯 `columns[].props` | [Element 功能列透传](../features/native-columns.md) |
| `columns[].headerHint`、Item `hint` | [Hint 提示体系](../features/hint.md) |
| `columns[].headerSlot` | [自定义表头](../features/custom-header.md) |
| `columns[].cellSlot` | [`cellSlot` 列级单元格](../features/cell-slot.md) |
| 各层 `visible` 与动态 props | [动态显隐与配置更新](../features/dynamic-configuration.md) |
| Column / Item `key` | [稳定身份与异步安全](../features/stable-identity.md) |
| `formItemProps.rules` | [校验、清理与重置](../features/validation-reset.md) |
