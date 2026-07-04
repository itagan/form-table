# 配置 API

FormTable 的配置核心由 `tableData`、`columns`、`rules`、`formData` 和 `customComponents` 组成。

## Props

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `tableData` | `TableRow[]` | 表格行数据 |
| `columns` | `ColumnConfig[]` | 表格列和单元格表单布局配置 |
| `rules` | `Record<string, ValidationRule[]>` | Element UI form rules，支持精确路径和通配路径 |
| `formData` | `FormTableRecord` | 表单级上下文数据 |
| `customComponents` | `CustomComponentConfig[]` | 自定义字段组件注册列表 |
| `loading` | `boolean` | 透传到内部 `el-table` 的加载状态 |

## ColumnConfig

```ts
interface ColumnConfig {
  key?: string
  name: string
  required?: boolean
  headerSlot?: string
  visible?: DynamicValue<boolean>
  props?: DynamicValue<ComponentBind>
  children: RowConfig[]
}
```

`props` 会透传给 `el-table-column`，例如 `width`、`align`、`type`、`renderHeader`。

## RowConfig

```ts
interface RowConfig {
  key?: string
  visible?: DynamicValue<boolean>
  bind?: DynamicValue<ComponentBind>
  props?: DynamicValue<ComponentBind>
  gutter?: number
  children: FormItemConfig[]
}
```

`children` 中的每一项对应一个表单字段。

## FormItemConfig

```ts
interface FormItemConfig {
  key: string
  type: FormItemType
  layout?: FormItemLayoutConfig
  component?: FormItemComponentConfig
  display?: FormItemDisplayConfig
  behavior?: FormItemBehaviorConfig
  rules?: any[]
  label?: string
  labelWidth?: string
}
```

配置职责建议：

- `layout`：控制字段布局，例如 `span`、`colProps`
- `component`：控制字段组件，例如 `bind`、`options`、`listeners`、`slotName`
- `display`：控制展示行为，例如 `tooltip`、`formatter`、`emptyText`
- `behavior`：控制运行时行为，例如 `visible`、`defaultValue`、`onValueChange`

## 规则路径

支持精确路径：

```ts
const rules = {
  'tableData.0.name': [{ required: true, message: '请输入姓名' }]
}
```

也支持动态行通配路径：

```ts
const rules = {
  'tableData.*.name': [{ required: true, message: '请输入姓名' }]
}
```
