# Hint 提示模式

> 可运行 Demo：[Hint 展示策略与自定义渲染 ↗](http://localhost:5173/hint-scenarios)。页面并列展示 title、Tooltip、自定义 Slot/组件与完全接管入口。

`headerHint/hint` 只表达提示内容，整张 FormTable 通过 `hintOptions` 统一选择展示策略。默认 `title` 模式保持浏览器原生提示；`tooltip` 模式让默认表头、自定义表头 Slot 和全部字段外层共享一个 `el-tooltip`，不会按行和字段创建 Tooltip 实例。

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :hint-options="{
    mode: 'tooltip',
    props: { placement: 'top' }
  }"
/>
```

同一张表不能混用两种模式。多个 FormTable 各自维护自己的 Tooltip 实例。

## 配置入口

| 需求 | 完整配置路径 | 应用节点 / 作用 |
| --- | --- | --- |
| 表级展示策略 | `hintOptions` | `{ mode: 'title' }`（默认）或 `{ mode: 'tooltip', props }` |
| Tooltip 属性 | `hintOptions.props` | 透传给表格唯一的 `el-tooltip` |
| 表头提示 | `columns[].headerHint` | 默认表头或 `headerSlot` 的统一包装节点 |
| 字段外层提示 | `columns[].children[].children[].hint` | `el-form-item` |
| 表头原生属性 | `columns[].headerProps.title` | 默认表头或 `headerSlot` 的统一包装节点 |
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

不配置 `hintOptions` 时继续输出原生 title，不渲染 FormTable 的 Hint Tooltip：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
/>
```

配置 `:hint-options="{ mode: 'tooltip' }"` 后，语义提示不再输出 title。根容器通过悬停和焦点事件委托识别当前表头或 `el-form-item`，动态更新唯一 Tooltip 的内容和锚点。悬停目标优先，约 50ms 后显示；没有悬停目标时，字段键盘焦点作为兜底并维护 `aria-describedby`。

`hintOptions.props` 可配置 Element UI Tooltip 的 `placement`、`effect`、`openDelay`、`popperClass` 等属性。`content/reference/popper/manual/value/enterable` 由 FormTable 管理，传入值不会覆盖内部行为。

## 空值行为

| 返回值 | 行为 |
| --- | --- |
| 非空字符串 | 按当前 `hintOptions.mode` 显示提示 |
| `''` | 不显示提示 |
| `null` / `undefined` | 移除提示 |

动态函数应直接返回最终展示字符串。Select、日期、对象等字段的内部值不一定等于用户看到的文本，FormTable 不猜测 label：

```ts
hint: ({ value }) => schoolLabelMap[value] || ''
```

## 自定义表头中的提示

配置 `headerSlot` 后，FormTable 仍会创建 `.form-table-column-header` 包装节点，并自动把 `headerProps/headerHint` 应用到该节点。Slot 只负责内部视觉内容，不需要绑定属性或创建 Tooltip：

```vue
<template #amount-header="{ label }">
  <span class="required-mark">*</span>
  <span>{{ label }}</span>
</template>
```

需要图标、富文本或可控制出现位置的提示时，参考[自定义表头](./custom-header.md)。

## 字段 Slot 自主管理 Tooltip

少量字段需要独立触发节点、内容或样式时，可以不配置 Item `hint`，直接在字段 Slot 内创建 `el-tooltip`：

```ts
{
  fieldKey: 'amount',
  type: 'slot',
  // 不配置 hint，避免与 Slot Tooltip 重复。
  component: { renderer: 'amount-editor' }
}
```

```vue
<template #amount-editor="{ value, setValue, row }">
  <el-input :value="value" @input="setValue" />
  <el-tooltip :content="`最大可填写 ${row.availableAmount} 元`">
    <i class="el-icon-question" aria-label="查看金额填写说明" />
  </el-tooltip>
</template>
```

这种方式会按行、按字段创建 Tooltip 实例，适合少量特殊交互；大量普通说明仍应使用 FormTable 的表级单实例 Hint。完整对照可查看 [`/hint-scenarios`](http://localhost:5173/hint-scenarios)。

## 边界

- `title` 模式的出现时间、样式和位置由浏览器决定。
- `tooltip` 模式只要 hint 非空就显示，不检查目标内容是否溢出。
- `tooltip` 模式每个 FormTable 只有一个实例，表头与字段不能分别选择模式。
- `component.props.title` 是否落在内部 input，取决于实际组件是否透传 `$attrs`。
- 配置了 `headerHint/hint` 时，表头和字段 Slot 的外层提示由 FormTable 自动应用，Slot 内部不应重复创建 Tooltip；若需要字段级自主管理，应省略该字段的 `hint`。
- `column.props.renderHeader` 是 Element UI 完全接管入口，FormTable 不包装也不应用 `headerHint/headerProps`。
- 纯文本 `cellSlot` 的截断提示应使用 `column.props.showOverflowTooltip`；它读取单元格展示文本，不替代业务 hint。

## 相关 API

[Column / Row / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md)
