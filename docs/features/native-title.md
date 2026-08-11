# Hint 提示模式

> 可运行 Demo：[基础表格表单 ↗](http://localhost:5173/form-table)。将鼠标移到“姓名和年龄”表头或姓名字段可查看 Tooltip。

`headerHint/hint` 只表达提示内容，整张 FormTable 通过 `hintMode` 统一选择展示方式。默认 `title` 模式保持浏览器原生提示；`tooltip` 模式让默认表头和全部字段外层共享一个 `el-tooltip`，不会按行和字段创建 Tooltip 实例。

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  hint-mode="tooltip"
/>
```

同一张表不能混用两种模式。多个 FormTable 各自维护自己的 Tooltip 实例。

## 配置入口

| 需求 | 完整配置路径 | 应用节点 / 作用 |
| --- | --- | --- |
| 表级展示模式 | `hintMode` | `'title'`（默认）或 `'tooltip'` |
| Tooltip 属性 | `hintTooltipProps` | 透传给表格唯一的 `el-tooltip` |
| 默认表头提示 | `columns[].headerHint` | 默认表头文本节点 |
| 字段外层提示 | `columns[].children[].children[].hint` | `el-form-item` |
| 默认表头原生属性 | `columns[].headerProps.title` | 默认表头文本节点 |
| 字段外层原生属性 | `columns[].children[].children[].formItemProps.title` | `el-form-item` |
| 实际组件 title | `columns[].children[].children[].component.props.title` | 由实际组件的 attrs 行为决定 |

`headerHint/hint` 表达 FormTable 外层提示语义；各级 `props.title` 只传给对应目标节点。显式声明 `headerHint/hint` 时，语义提示覆盖同层的 `headerProps.title/formItemProps.title`；未声明时保持原始 title 透传。

## 配置示例

```ts
const columns: ColumnConfig[] = [{
  label: '备注',
  headerHint: ({ tableData }) => `当前共 ${tableData.length} 条记录`,
  children: [{
    children: [{
      fieldKey: 'remark',
      type: 'textarea',
      // 内容较长或被截断时，悬停字段外层可读取完整文本。
      hint: ({ value }) => value == null ? undefined : String(value),
      component: {
        props: {
          rows: 2,
          maxlength: 500,
          showWordLimit: true
        }
      }
    }]
  }]
}]
```

## 两种模式

不配置 `hintMode` 时继续输出原生 title，不渲染 FormTable 的 Hint Tooltip：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
/>
```

配置 `hint-mode="tooltip"` 后，语义提示不再输出 title。根容器通过悬停和焦点事件委托识别当前表头或 `el-form-item`，动态更新唯一 Tooltip 的内容和锚点。悬停目标优先，约 50ms 后显示；没有悬停目标时，字段键盘焦点作为兜底并维护 `aria-describedby`。

`hintTooltipProps` 可配置 Element UI Tooltip 的 `placement`、`effect`、`openDelay`、`popperClass` 等属性。`content/reference/popper/manual/value/enterable` 由 FormTable 管理，传入值不会覆盖内部行为。

## 空值行为

| 返回值 | 行为 |
| --- | --- |
| 非空字符串 | 按当前 `hintMode` 显示提示 |
| `''` | 不显示提示 |
| `null` / `undefined` | 移除提示 |

动态函数应直接返回最终展示字符串。Select、日期、对象等字段的内部值不一定等于用户看到的文本，FormTable 不猜测 label：

```ts
hint: ({ value }) => schoolLabelMap[value] || ''
```

## 自定义表头中的提示

配置 `headerSlot` 后，表头 DOM 由调用方完全控制，表级 `hintMode` 不接管 Slot 内部节点。Slot 会返回已解析的 `header`，由模板自行绑定原生 title 或创建 Tooltip：

```vue
<template #amount-header="{ label, header }">
  <span v-bind="header.props" :title="header.hint">
    {{ label }}
  </span>
</template>
```

需要图标、富文本或可控制出现位置的提示时，参考[自定义表头](./custom-header.md)。

## 边界

- `title` 模式的出现时间、样式和位置由浏览器决定。
- `tooltip` 模式只要 hint 非空就显示，不检查目标内容是否溢出。
- `tooltip` 模式每个 FormTable 只有一个实例，表头与字段不能分别选择模式。
- `component.props.title` 是否落在内部 input，取决于实际组件是否透传 `$attrs`。
- 自定义表头、字段 Slot 内部节点和 Element UI 功能列表头由调用方自行绑定提示。
- 纯文本 `cellSlot` 的截断提示应使用 `column.props.showOverflowTooltip`；它读取单元格展示文本，不替代业务 hint。

## 相关 API

[Column / Row / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md)
