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

## 一分钟选型

| 场景 | 推荐配置 | 原因 |
| --- | --- | --- |
| 少量固定补充说明 | `hint: '说明文本'` | 最短配置，默认使用原生 title |
| 大量字段展示自身完整值 | 表级 `fieldFormatter` + 字段 `hint: true` | 格式化只写一次，字段按需开启 |
| 提示依赖当前行、选项或权限 | `hint: context => ...` | 每次响应式更新都基于当前上下文求值 |
| 全表需要统一视觉和延迟 | `hintOptions.mode: 'tooltip'` | 表头和字段共享一个 Tooltip 实例 |
| 单个位置需要图标、富文本或独立交互 | `{ content, ownership: 'custom' }` + Slot | 内容保留在 Schema，展示完全交给调用方 |
| 业务组件需要提示文案作为 prop | `component.props: ({ hint }) => ({ ... })` | 显式映射，不污染所有业务组件 props |
| 纯展示单元格只需截断提示 | `column.props.showOverflowTooltip` | 这是展示文本溢出，不是字段说明语义 |
| 必填、错误或关键操作说明 | 常驻文本、校验消息或可聚焦控件 | 关键信息不能只依赖悬停提示 |

推荐从最简单的 `hint: '...'` 开始。只有大量字段需要同一种值格式化时才启用 `fieldFormatter`；只有需要统一视觉、键盘访问和延迟控制时才切换到 Tooltip；只有特殊交互才把所有权交给 Slot。

## 核心模型

Hint 分成三个相互独立的决定：

1. **内容从哪里来**：固定字符串、动态回调，或 `hint: true` 触发表级 formatter。
2. **谁负责展示**：`ownership: 'table'` 由 FormTable 展示；`ownership: 'custom'` 只保留标准化内容，由调用方展示。
3. **FormTable 如何展示**：整表统一选择浏览器原生 `title` 或单实例 `tooltip`。

因此 `fieldFormatter` 只负责生成字符串，不决定展示方式；`ownership` 只决定展示责任，不改变内容；`mode` 只影响 FormTable 托管的 Hint，不影响自定义 Hint。

```text
字段 hint / 表头 headerHint
        ↓ 解析内容
ResolvedFormTableHint { content, ownership }
        ↓ 判断所有权
table → 按整表 mode 输出 title 或 singleton Tooltip
custom → FormTable 不写 title、内部标记或 ARIA
```

表头与字段遵循相同的目标属性优先级：

| 配置状态 | 同层 `headerProps.title/formItemProps.title` | FormTable 自动提示 |
| --- | --- | --- |
| 未声明 Hint | 保留 | 无 |
| `ownership: 'custom'` | 保留 | 无 |
| 托管且内容非空 | 被 Hint 覆盖 | 按整表 mode 展示 |
| 显式 `''`、`null` 或 `undefined` | 移除 | 无 |

“显式空值”适合动态关闭提示：它与完全不声明 Hint 不同，前者会同时清除同层透传 title，后者保留底层属性。

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

## 常见场景配方

### 1. 固定字段说明

默认 title 模式下只需要一行配置：

```ts
{
  fieldKey: 'taxNumber',
  type: 'input',
  hint: '请输入营业执照上的统一社会信用代码'
}
```

需要统一视觉时只切换表级 mode，字段配置不变：

```ts
const hintOptions = {
  mode: 'tooltip',
  props: { placement: 'top', openDelay: 150 }
}
```

### 2. 大量字段复用格式化

金额、日期和枚举等字段可以按 `itemConfig` 或 `fieldKey` 集中处理。只在确实需要提示的 Item 上写 `hint: true`：

```ts
const hintOptions: FormTableHintOptions<OrderRow> = {
  mode: 'tooltip',
  fieldFormatter: ({ value, fieldKey, itemConfig }) => {
    if (value == null || value === '') return null
    if (fieldKey === 'amount') return `当前金额：¥${Number(value).toFixed(2)}`
    if (itemConfig.type === 'date') return formatDate(value)
    return String(value)
  }
}
```

如果个别字段需要特殊文案，直接提供显式 Hint 即可覆盖通用规则：

```ts
{ fieldKey: 'amount', type: 'input', hint: true }
{ fieldKey: 'status', type: 'select', hint: '状态由审批流程自动更新' }
```

### 3. 依赖当前行的动态提示

额度、库存、权限等说明应使用动态回调。回调返回最终内容，不要把业务判断放进 Slot：

```ts
hint: ({ row, value }) => {
  if (!row.canEdit) return '当前状态不可编辑'
  return `已填写 ${value || 0}，本行最多可填写 ${row.availableAmount}`
}
```

动态决定是否复用统一 formatter 时可以返回 `true`：

```ts
hint: ({ row }) => row.showFullValue ? true : null
```

Select、级联选择和对象字段应自行把内部值映射为用户看到的 label：

```ts
hint: ({ value }) => statusOptions.find(option => option.value === value)?.label || ''
```

### 4. 自定义组件消费标准化 Hint

component 的 `resolveRenderer/props/options/optionProps` 和 listener 都获得同一份解析后 `hint`。FormTable 不会把它隐式塞进业务组件 props，需要显式映射：

```ts
{
  fieldKey: 'address',
  type: 'component',
  hint: ({ row }) => `配送范围：${row.deliveryArea}`,
  component: {
    renderer: AddressEditor,
    props: ({ hint }) => ({
      helpText: hint?.content,
      showHelp: hint?.ownership === 'custom'
    })
  }
}
```

如果只是希望 FormTable 在组件外层自动提示，保持默认 `ownership: 'table'`，无需映射 props。只有业务组件内部需要消费内容时才做显式映射。

### 5. 动态关闭和切换所有权

同一个字段可根据业务状态在自动展示、自定义展示和关闭之间切换：

```ts
hint: ({ row }) => {
  if (!row.showHelp) return null
  if (row.useHelpIcon) {
    return { content: row.helpText, ownership: 'custom' }
  }
  return row.helpText
}
```

动态切换到 `custom` 后，FormTable 会停止自动提示并保留原始 `formItemProps`；切换为空值后会移除当前自动提示和同层 title。Slot 和 component 配置在同一渲染周期读取到的是同一份标准化结果。

### 6. 表头、字段 Slot 与嵌套表格

- 默认表头和 `headerSlot` 都使用 `headerHint`；Slot 内只是增加图标或排版时，继续让 FormTable 托管。
- 图标本身需要成为独立触发点时，使用 `ownership: 'custom'`，并为图标提供 `tabindex`、`aria-label` 等键盘语义。
- 字段 Slot 同理：普通输入仍让外层 `el-form-item` 托管；特殊按钮、富文本或点击逻辑才交给 Slot。
- 嵌套 FormTable 无需额外配置；每个实例只响应最近根容器内的目标，内层提示不会同时驱动外层 Tooltip。

### 7. 运行时切换 title / Tooltip

`hintOptions` 可以响应式切换，Hint 内容配置无需重写：

```vue
<FormTable
  v-model="rows"
  :columns="columns"
  :hint-options="useTooltip
    ? { mode: 'tooltip', props: { placement: 'top' } }
    : { mode: 'title' }"
/>
```

切换模式只改变 FormTable 托管 Hint 的呈现方式。`ownership: 'custom'` 的内容、Slot 内 Tooltip 和组件自己的 `title` 不受影响。

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
