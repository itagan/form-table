# Column / Item

## 路径关系

```text
columns[]                                  ColumnConfig
├─ props only                            NativeColumnConfig
├─ children[]                            FormItemConfig
│  └─ component                     FieldComponentConfig
└─ cellSlot                              列级单元格 Slot
```

`NativeColumnConfig`、`children[]` 和 `cellSlot` 是三条互斥路径。纯 Element Column 只提供 `props`；字段列使用 `children[]`；不需要字段路径和校验的自定义单元格可使用 [`cellSlot`](../features/cell-slot.md)。

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
| `columns[].children` | `FormItemConfig[]` | 与 `cellSlot` 互斥 | — | 进入 Item 字段链路 |
| `columns[].cellSlot` | `string` | 与 `children` 互斥 | `row, index, columnConfig, updateRow` | 直接渲染单元格 |

无需字段渲染链路的功能列使用 `NativeColumnConfig`，所有 Element Column 属性继续放在 `props` 中：

```ts
{ props: { type: 'selection', width: 48 } }
{ label: '序号', props: { type: 'index', width: 64 } }
```

纯透传列的 `props` 必填、`label` 可选，且不接受 `children/cellSlot/headerSlot/headerProps/headerHint`。选择事件、序号函数和动态配置见[Element 功能列透传](../features/native-columns.md)。

## FormItemConfig

| 配置路径 | 类型 | 必填 / 默认值 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].children[].key` | `string` | 可选 | — | Item 稳定渲染身份 |
| `columns[].children[].fieldKey` | `string` | 必填 | — | 行数据路径，支持 `profile.city`、`items[0].name` |
| `columns[].children[].type` | `BuiltinFormItemType \| 'component' \| 'slot'` | 必填 | — | 字段渲染模式 |
| `columns[].children[].visible` | `DynamicValue<boolean, ItemContext>` | `true` | RowContext + `fieldKey, value, itemConfig` | 字段显隐 |
| `columns[].children[].colProps` | `DynamicValue<ComponentProps, ItemContext>` | `{ span: 24 }` | ItemContext | 透传 `el-col` |
| `columns[].children[].formItemProps` | `DynamicValue<ComponentProps, ItemContext>` | `{}` | ItemContext | 透传 `el-form-item` |
| `columns[].children[].formItemProps.rules` | Element UI Rule(s) | 可选 | Element UI | 字段校验规则 |
| `columns[].children[].hint` | `DynamicValue<FormTableHintValue, ItemContext>` | 可选 | ItemContext | 未声明或空值继承全局，`false` 关闭，非空字符串覆盖 |
| `columns[].children[].component` | `FieldComponentConfig` | 按 `type` 决定 | ItemContext | 字段组件、Slot 和绑定配置 |

每个字段单元格固定只渲染一个可换行的 Flex `el-row`。每个 Item 对应一个 `el-col`，`span` 默认为 24；多个 Item 可按 24 栅格总和自然换行。非规则的多 Row 布局使用 [`cellSlot`](../features/cell-slot.md) 手写。

## 校验路径

Item 的 `fieldKey` 会自动转换为 Element UI 表单路径：

```text
fieldKey: profile.city
propPath: tableData.0.profile.city
```

`formItemProps.prop` 会被 FormTable 生成的完整路径覆盖，确保校验模型与字段更新一致。

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
