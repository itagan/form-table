# Column / Row / Item

## 路径关系

```text
columns[]                                  ColumnConfig
├─ children[]                            RowConfig
│  └─ children[]                     FormItemConfig
│     └─ component                   FieldComponentConfig
└─ cellSlot                              列级单元格 Slot
```

`columns[].children[]` 和 `columns[].cellSlot` 互斥。字段列使用 `children[]`；不需要字段路径和校验的单元格可使用 [`cellSlot`](../features/cell-slot.md)。

## ColumnConfig

| 配置路径 | 类型 | 必填 / 默认值 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].key` | `string` | 可选 | — | 列的稳定渲染身份 |
| `columns[].label` | `string` | 必填 | — | `el-table-column.label` |
| `columns[].visible` | `DynamicValue<boolean, ColumnContext>` | `true` | `tableData, columnConfig` | 是否渲染列 |
| `columns[].props` | `DynamicValue<ComponentProps, ColumnContext>` | `{}` | `tableData, columnConfig` | 透传 `el-table-column` |
| `columns[].headerSlot` | `string` | 可选 | Slot scope | 表头具名 Slot |
| `columns[].headerProps` | `DynamicValue<ComponentProps, ColumnContext>` | `{}` | `tableData, columnConfig` | 默认或 Slot 表头包装节点属性 |
| `columns[].headerHint` | `DynamicValue<FormTableHint \| null \| undefined, ColumnContext>` | 可选 | `tableData, columnConfig` | 表头 Hint；`ownership: 'table'` 由 `hintOptions` 展示，`custom` 时不自动处理 |
| `columns[].children` | `RowConfig[]` | 与 `cellSlot` 互斥 | — | 进入 Row / Item 字段链路 |
| `columns[].cellSlot` | `string` | 与 `children` 互斥 | `row, index, columnConfig, updateRow` | 直接渲染单元格 |

`columns[].props` 可传入 `width/minWidth/fixed/align/type` 等 Element UI 原生属性。`selection/index/expand` 功能列使用 `columns[].props.type`，不与 `cellSlot` 混用。

## RowConfig

| 配置路径 | 类型 | 必填 / 默认值 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].children[].key` | `string` | 可选 | — | 布局行渲染身份 |
| `columns[].children[].visible` | `DynamicValue<boolean, RowContext>` | `true` | ColumnContext + `row, index, rowConfig` | 是否渲染布局行 |
| `columns[].children[].props` | `DynamicValue<ComponentProps, RowContext>` | `{}` | RowContext | 透传 `el-row` |
| `columns[].children[].children` | `FormItemConfig[]` | 必填 | — | 当前布局行内的字段 |

## FormItemConfig

| 配置路径 | 类型 | 必填 / 默认值 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].children[].children[].key` | `string` | 可选 | — | Item 稳定渲染身份 |
| `columns[].children[].children[].fieldKey` | `string` | 必填 | — | 行数据路径，支持 `profile.city`、`items[0].name` |
| `columns[].children[].children[].type` | `BuiltinFormItemType \| 'component' \| 'slot'` | 必填 | — | 字段渲染模式 |
| `columns[].children[].children[].visible` | `DynamicValue<boolean, ItemContext>` | `true` | RowContext + `fieldKey, value, itemConfig` | 字段显隐 |
| `columns[].children[].children[].colProps` | `DynamicValue<ComponentProps, ItemContext>` | `{ span: 24 }` | ItemContext | 透传 `el-col` |
| `columns[].children[].children[].formItemProps` | `DynamicValue<ComponentProps, ItemContext>` | `{}` | ItemContext | 透传 `el-form-item` |
| `columns[].children[].children[].formItemProps.rules` | Element UI Rule(s) | 可选 | Element UI | 字段校验规则 |
| `columns[].children[].children[].hint` | `DynamicValue<FormTableHint \| null \| undefined, ItemContext>` | 可选 | ItemContext | 字段 Hint；`ownership: 'table'` 应用于 `el-form-item`，`custom` 时不自动处理 |
| `columns[].children[].children[].component` | `FieldComponentConfig` | 按 `type` 决定 | Resolved ItemContext（增加 `hint`） | 字段组件、Slot 和绑定配置 |

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
| `columns[].headerHint`、Item `hint` | [Hint 提示模式](../features/native-title.md) |
| `columns[].headerSlot` | [自定义表头](../features/custom-header.md) |
| `columns[].cellSlot` | [`cellSlot` 列级单元格](../features/cell-slot.md) |
| 各层 `visible` 与动态 props | [动态显隐与配置更新](../features/dynamic-configuration.md) |
| Column / Row / Item `key` | [稳定身份与异步安全](../features/stable-identity.md) |
| `formItemProps.rules` | [校验、清理与重置](../features/validation-reset.md) |
