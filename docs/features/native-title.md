# Hint 提示模式

> 可运行 Demo：[Hint 展示策略与自定义渲染 ↗](http://localhost:5173/hint-scenarios)。页面并列展示 title、Tooltip、自定义 Slot/组件与完全接管入口。

`headerHint/hint` 保存提示内容与托管归属，整张 FormTable 通过 `hintOptions` 统一选择自动提示的展示策略。字符串默认由 FormTable 托管；默认 `title` 模式保持浏览器原生提示，`tooltip` 模式让默认表头、自定义表头 Slot 和全部字段外层共享一个 `el-tooltip`。

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
| 字段统一格式化 | `hintOptions.fieldFormatter` | `hint: true` 时根据字段上下文生成内容 |
| 表头提示 | `columns[].headerHint` | 默认表头或 `headerSlot` 的统一包装节点 |
| 字段外层提示 | `columns[].children[].children[].hint` | `el-form-item` |
| 表头原生属性 | `columns[].headerProps.title` | 默认表头或 `headerSlot` 的统一包装节点 |
| 字段外层原生属性 | `columns[].children[].children[].formItemProps.title` | `el-form-item` |
| 实际组件 title | `columns[].children[].children[].component.props.title` | 由实际组件的 attrs 行为决定 |

`headerHint/hint` 表达提示语义；各级 `props.title` 只传给对应目标节点。自动托管的显式 Hint 会覆盖同层 `headerProps.title/formItemProps.title`；`ownership: 'custom'` 或未声明 Hint 时，原始 title 保持透传。

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

字符串等价于 `{ content: '提示内容', ownership: 'table' }`。对象省略 `ownership` 时同样默认由 FormTable 托管：

```ts
hint: '字段说明'
// 等价于
hint: { content: '字段说明', ownership: 'table' }
```

## 字段统一格式化

多数提示只是当前字段完整值时，可在表级配置一次 `fieldFormatter`，字段使用 `hint: true` 开启：

```ts
const hintOptions: FormTableHintOptions = {
  mode: 'tooltip',
  fieldFormatter: ({ value, fieldKey, itemConfig }) => {
    if (value == null || value === '') return ''
    if (itemConfig.type === 'date') return formatDate(value)
    return `${fieldKey}：${String(value)}`
  }
}

const columns: ColumnConfig[] = [{
  label: '备注',
  children: [{ children: [{
    fieldKey: 'remark',
    type: 'input',
    hint: true
  }] }]
}]
```

未配置 `fieldFormatter` 时，`hint: true` 默认把 `null/undefined` 格式化为空字符串，其余值使用 `String(value)`。formatter 返回 `null/undefined` 时标准化结果为 `null`，返回空字符串时保留空的表格托管 Hint；两者都不显示提示。

显式字符串、对象和动态 Hint 函数优先，不经过 `fieldFormatter`。动态函数也可以返回 `true`，按当前字段上下文调用统一 formatter。该 formatter 只接收基础 `FormTableFieldRenderContext`，不包含解析后的 component 配置。

## 两种模式

不配置 `hintOptions` 时继续输出原生 title，不渲染 FormTable 的 Hint Tooltip：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
/>
```

配置 `:hint-options="{ mode: 'tooltip' }"` 后，语义提示不再输出 title。根容器通过悬停和焦点事件委托识别当前表头或 `el-form-item`，动态更新唯一 Tooltip 的内容和锚点。悬停目标优先；显示延迟只由 `openDelay` 控制。没有悬停目标时，字段键盘焦点作为兜底并维护 `aria-describedby`。

托管且内容非空的表头默认获得 `tabindex="0"`，可通过键盘聚焦查看；显式 `headerProps.tabindex` 优先。Header Slot 内已经提供按钮等交互节点时，可配置 `headerProps: { tabindex: -1 }` 避免重复 Tab 停靠点。按 `Escape` 会关闭当前 Tooltip，直到指针或焦点发生下一次有效迁移。

`hintOptions.props` 可配置 Element UI Tooltip 的 `placement`、`effect`、`openDelay`、`popperClass` 等属性。`content/reference/popper/manual/value/enterable` 由 FormTable 管理，传入值不会覆盖内部行为。

## 空值行为

| 返回值 | 行为 |
| --- | --- |
| `true` | 使用 `hintOptions.fieldFormatter`，未配置时格式化当前字段值 |
| 非空字符串或 `{ content, ownership: 'table' }` | 按当前 `hintOptions.mode` 自动显示提示 |
| `{ content, ownership: 'custom' }` | FormTable 不处理提示；配置内容的用途由调用方决定 |
| `''` 或 `{ content: '', ownership: 'table' }` | 不显示提示 |
| `null` / `undefined` | 移除自动提示，Slot 获得 `null` |

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

少量字段需要独立触发节点、内容或样式时，可以把内容继续保存在 Item `hint` 中，并用 `ownership: 'custom'` 将展示权交给字段 Slot：

```ts
{
  fieldKey: 'amount',
  type: 'slot',
  hint: ({ row }) => ({
    content: `最大可填写 ${row.availableAmount} 元`,
    ownership: 'custom'
  }),
  component: { renderer: 'amount-editor' }
}
```

```vue
<template #amount-editor="{ value, setValue, hint }">
  <el-input :value="value" @input="setValue" />
  <el-tooltip :content="hint.content">
    <i class="el-icon-question" aria-label="查看金额填写说明" />
  </el-tooltip>
</template>
```

`ownership: 'custom'` 对所有字段类型行为一致：内置字段、自定义组件和字段 Slot 都不会写入 title、内部标记或 ARIA，也不会占用表级 singleton。字段 Slot、component 动态配置和 listener 都能读取标准化后的 `{ content, ownership: 'custom' }`；业务组件本身不会被隐式注入同名 prop。表头也可用相同方式配置 `headerHint`，再从 `header.hint.content` 读取。

```ts
component: {
  renderer: BusinessEditor,
  props: ({ hint }) => ({ helpText: hint?.content })
}
```

这种方式会按行、按字段创建 Tooltip 实例，适合少量特殊交互；大量普通说明仍应使用 FormTable 的表级单实例 Hint。如果提示内容完全不属于 Schema，也可以不配置 `hint`，直接在 Slot 内独立处理。完整对照可查看 [`/hint-scenarios`](http://localhost:5173/hint-scenarios)，其中包含内置字段、component、字段 Slot 与未配置 Hint 的所有权矩阵及完整配置。

## 边界

- `title` 模式的出现时间、样式和位置由浏览器决定。
- `tooltip` 模式只要 hint 非空就显示，不检查目标内容是否溢出。
- `tooltip` 模式每个 FormTable 只有一个实例，表头与字段不能分别选择模式。
- `component.props.title` 是否落在内部 input，取决于实际组件是否透传 `$attrs`。
- `fieldFormatter` 只处理 `hint: true`，不会改写任何显式 Hint 内容。
- `ownership: 'table'` 时表头和字段 Slot 的外层提示由 FormTable 自动应用，Slot 内部不应重复创建 Tooltip；`ownership: 'custom'` 时 FormTable 不处理提示，与字段渲染类型无关。
- 普通 `component.renderer` 不会自动收到 `hint` prop；可在 `component.props` 中读取标准化 `hint` 后显式映射为业务组件需要的属性。
- Hint 只适合作为补充说明；必填状态、校验错误和关键操作信息必须有始终可见或可聚焦的表达，不能只依赖悬停。
- `column.props.renderHeader` 是 Element UI 完全接管入口，FormTable 不包装也不应用 `headerHint/headerProps`。
- 纯文本 `cellSlot` 的截断提示应使用 `column.props.showOverflowTooltip`；它读取单元格展示文本，不替代业务 hint。

## 相关 API

[Column / Row / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md)
