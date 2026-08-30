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

> **能力边界：**当前 FormTable 不支持嵌套 `el-table-column` 形成的多级表头。`columns[].formItems` 表示单元格内的表单字段；`headerSlot` 只能自定义单个表头单元格的内容，不提供跨列分组或多行层级能力。当前替代方案见 [Element UI 能力边界](../features/element-ui-boundaries.md#多级表头)。

## ColumnConfig

| 配置路径 | 类型 | 必填 / 默认值 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].key` | `string` | 可选 | — | 列的稳定渲染身份 |
| `columns[].label` | `string` | 布局列和 cellSlot 列必填；原生列可选 | — | 默认列标题；可由解析后的 `columns[].props.label` 覆盖 |
| `columns[].visible` | `DynamicValue<boolean, ColumnContext>` | `true` | `tableData, columnConfig` | 是否渲染列 |
| `columns[].props` | `DynamicValue<ComponentProps, ColumnContext>` | `{}` | `tableData, columnConfig` | 透传 `el-table-column` |
| `columns[].headerSlot` | `string` | 可选 | Slot scope | 表头具名 Slot |
| `columns[].headerProps` | `DynamicValue<ComponentProps, ColumnContext>` | `{}` | `tableData, columnConfig` | 默认或 Slot 表头包装节点属性 |
| `columns[].headerHint` | `DynamicValue<FormTableHintValue, ColumnContext>` | 可选 | `tableData, columnConfig` | 表头 Hint；仅在 `targets: 'header'/'all'` 时求值和展示 |
| `columns[].rowProps` | `DynamicValue<ComponentProps, RowContext>` | `{ type: 'flex' }` | ColumnContext + `row, index, displayIndex` | 透传单元格内唯一 `el-row`；显式 `type` 可覆盖默认值 |
| `columns[].formItems` | `FormItemConfig[]` | 与 `cellSlot` 互斥 | — | 进入 Item 字段链路 |
| `columns[].cellSlot` | `string` | 与 `formItems` 互斥 | `row, index, displayIndex, columnConfig, updateRow` | 直接渲染单元格 |

无需字段渲染链路的功能列使用 `NativeColumnConfig`，所有 Element Column 属性继续放在 `props` 中：

```ts
{ props: { type: 'selection', width: 48 } }
{ label: '序号', props: { type: 'index', width: 64 } }
```

纯透传列的 `props` 必填、`label` 可选，且不接受 `formItems/cellSlot/headerSlot/headerProps/headerHint`。选择事件、序号函数和动态配置见[Element 功能列透传](../features/native-columns.md)。

`columns[].label` 是静态默认标题；`columns[].props.label` 按 ColumnContext 解析后非 `null/undefined` 时覆盖它。最终标题同时用于 Element Column、默认表头文本和 `headerSlot.label`，原始 `columnConfig.label` 保持不变：

```ts
{
  label: '金额',
  props: ({ tableData }) => ({
    label: `金额（${tableData.length} 项）`
  }),
  formItems: [{ fieldKey: 'amount', type: 'number' }]
}

{ props: { label: '姓名', prop: 'name' } }
```

## FormItemConfig

| 配置路径 | 类型 | 必填 / 默认值 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].formItems[].key` | `string` | 可选 | — | Item 稳定渲染身份 |
| `columns[].formItems[].fieldKey` | `string` | 必填 | — | 行数据路径，支持 `profile.city`、`items[0].name` |
| `columns[].formItems[].binding` | `FieldBindingConfig` | 可选 | — | 将多个行字段映射为一个组件或字段 Slot 复合值 |
| `columns[].formItems[].binding.map` | `FieldBindingMapEntry[]` | 至少一项 | — | 多字段双向路径映射 |
| `columns[].formItems[].binding.map[].fieldPath` | `string` | 必填 | — | `tableData` 行中的目标字段路径 |
| `columns[].formItems[].binding.map[].valuePath` | `string` | 必填 | — | 组件复合值中的取值路径 |
| `columns[].formItems[].binding.map[].fallbackValue` | `FormTableValue` | 可选 | — | 组件值中无法解析 `valuePath` 时写入 `fieldPath` 的兜底值 |
| `columns[].formItems[].meta` | `FormTableRecord` | 可选 | — | 使用方挂载的静态业务元数据；FormTable 不解析、复制或消费 |
| `columns[].formItems[].type` | `BuiltinFormItemType \| 'component' \| 'slot'` | 必填 | — | 字段渲染模式 |
| `columns[].formItems[].labelSlot` | `string` | 可选 | FormItem Slot scope | 自定义 `el-form-item` Label |
| `columns[].formItems[].errorSlot` | `string` | 可选 | Error Slot scope | 自定义校验错误内容 |
| `columns[].formItems[].visible` | `DynamicValue<boolean, ItemContext>` | `true` | RowContext + `fieldKey, value, itemConfig` | 字段显隐 |
| `columns[].formItems[].colProps` | `DynamicValue<ComponentProps, ItemContext>` | `{ span: 24 }` | ItemContext | 透传 `el-col` |
| `columns[].formItems[].formItemProps` | `DynamicValue<FormTableFormItemProps, ItemContext>` | `{}` | ItemContext | 透传 `el-form-item`；不接受内部管理的 `prop` |
| `columns[].formItems[].formItemProps.rules` | Element UI Rule(s) | 可选 | Element UI | 字段校验规则 |
| `columns[].formItems[].hint` | `DynamicValue<FormTableHintValue, ItemContext>` | 可选 | ItemContext | 未声明或空值继承全局，`false` 关闭，非空字符串覆盖 |
| `columns[].formItems[].hintTrigger` | `'item' \| 'content'` | `'item'` | — | 使用整个 FormItem 或唯一可见内容根节点触发 Hint |
| `columns[].formItems[].component` | `FieldComponentConfig` | 按 `type` 决定 | ItemContext | 字段组件、Slot 和绑定配置 |

`meta` 是 Item 的静态扩展点，适合权限、埋点、业务角色和远程 Schema 标识。它不是 `DynamicValue`，不会自动进入实际组件 Props，也不影响字段值、校验、显隐、model 或渲染身份。所有字段上下文均可通过原始配置 `itemConfig.meta` 读取；行级差异继续直接读取 `row/value`。

`binding.map` 只改变实际字段组件接收和写回的复合值；动态配置上下文的 `value`、Hint 和 `el-form-item.prop` 仍对应主 `fieldKey`。完整映射、清空、Slot 和校验语义见[复合字段映射](../features/composite-binding.md)。

每个字段单元格固定只渲染一个 `el-row`，其 `type` 默认为 `flex`。可通过 `rowProps.type` 显式覆盖，例如 `{ type: undefined }` 使用 Element UI 普通 Row。每个 Item 对应一个 `el-col`，`span` 默认为 24；多个 Item 可按 24 栅格总和自然换行。非规则的多 Row 布局使用 [`cellSlot`](../features/cell-slot.md) 手写。

`rowProps`、`colProps` 和 `formItemProps` 都接受 Element UI 对应组件支持的 class/style，并与 FormTable 内部稳定类名合并。需要判断样式应该落在哪一层、使用动态 class 或处理 scoped CSS 时，参见[样式定位与属性透传](../features/style-props.md)。

## 校验路径

Item 的 `fieldKey` 会自动转换为 Element UI 表单路径：

```text
fieldKey: profile.city
propPath: tableData.0.profile.city
```

`el-form-item.prop` 原本用于指向 `el-form.model` 中参与校验、清理和重置的字段。FormTable 根据当前行在受控 `tableData` 中的数据源下标和 `fieldKey` 自动生成完整路径，确保 Element Table 内部排序或筛选后，同名字段仍拥有独立校验状态并与字段更新目标一致。

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
| Row / Col / FormItem class、style | [样式定位与属性透传](../features/style-props.md) |
