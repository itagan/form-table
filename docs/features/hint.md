# Hint 提示体系

> 可运行 Demo：[Hint 展示策略与自定义渲染 ↗](http://localhost:5173/hint-scenarios)

Hint 用于表头或字段的补充说明。FormTable 把“提示内容”和“如何展示”分开配置：

- `headerHint` / Item `hint`：提供当前位置的提示内容。
- `hintOptions.field`：为普通字段提供整表默认内容。
- `hintOptions.mode`：决定 FormTable 托管的提示使用原生 `title` 还是单实例 Tooltip。
- `behavior`：决定由 FormTable 自动展示，还是交给 Slot / 业务组件处理。

## 先记住这四条

```ts
hintOptions: { field: true }                       // 全表字段默认 String(value)
hintOptions: { field: context => format(context) } // 全表字段统一格式化
hint: false                                        // 当前字段明确关闭
hint: '字段自己的说明'                             // 当前字段覆盖全局
```

字段覆盖规则只有一句话：

> Item `hint` 不写或返回空值就继承全局，`false` 就关闭，提供非空内容就覆盖。

不配置 `hintOptions.field`，或显式配置 `field: false`，都表示不启用全局字段 Hint。表头 `headerHint` 始终显式配置，不继承字段默认策略。

## 最小示例

默认使用浏览器原生 `title`，因此少量说明只需配置内容：

```ts
const columns: ColumnConfig[] = [{
  label: '税号',
  headerHint: '纳税人识别号',
  children: [{
    children: [{
      fieldKey: 'taxNumber',
      type: 'input',
      hint: '请输入营业执照上的统一社会信用代码'
    }]
  }]
}]
```

需要统一样式、位置和延迟时，只切换整表模式，原有 Hint 内容不需要修改：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :hint-options="{
    mode: 'tooltip',
    props: { placement: 'top', openDelay: 150 }
  }"
/>
```

同一张表的自动 Hint 只能使用一种模式；多个 FormTable 各自维护独立的 Tooltip 实例。

## 配置地图

| 需求 | 配置位置 | 说明 |
| --- | --- | --- |
| 表头说明 | `columns[].headerHint` | 默认表头和 `headerSlot` 外层包装节点 |
| 字段说明 | `columns[].children[].children[].hint` | 当前字段的 `el-form-item` |
| 字段默认内容 | `hintOptions.field` | 只作用于未声明或返回空 Hint 的字段 |
| 自动展示方式 | `hintOptions.mode` | 整表统一使用 `title` 或 `tooltip` |
| Tooltip 属性 | `hintOptions.props` | 透传给整表唯一的 `el-tooltip` |
| 自定义展示 | `behavior: 'custom'` | FormTable 解析内容，但不创建自动提示行为 |

常用类型：

```ts
type FormTableDefaultFieldHint<TRow> =
  | boolean
  | FormTableFieldHintFormatter<TRow>

type FormTableFieldHint =
  | false
  | string
  | {
      content: string
      behavior?: 'auto' | 'custom'
    }

interface ResolvedFormTableHint {
  content: string
  behavior: 'auto' | 'custom'
}
```

字符串等价于 `{ content: '...', behavior: 'auto' }`。缺省 `behavior` 时由 FormTable 自动处理。

## 字段如何得到最终 Hint

### 第一步：读取 Item `hint`

| Item `hint` | 最终行为 |
| --- | --- |
| 未声明、`null`、`undefined`、`''` | 继续读取 `hintOptions.field` |
| `false` | 明确关闭当前字段，不再读取全局配置 |
| 非空字符串 | 覆盖全局，标准化为 `behavior: 'auto'` |
| 非空对象 | 覆盖全局，使用对象的 `content/behavior` |
| 动态回调 | 先求值，再按以上规则处理 |

### 第二步：必要时读取 `hintOptions.field`

| `hintOptions.field` | 结果 |
| --- | --- |
| 未配置或 `false` | 没有全局字段 Hint |
| `true` | 空字段不提示；其余使用 `String(value)` |
| formatter | 使用 formatter 返回的最终字符串 |
| formatter 返回 `null/undefined/''` | 不提示，不再继续回退 |

```text
Item hint 有非空内容 ── 是 ──→ 使用 Item 内容
        │ 否
        ↓
Item hint 是 false ─── 是 ──→ 关闭
        │ 否
        ↓
读取 hintOptions.field ─────→ ResolvedFormTableHint | null
```

空值表示“没有提供字段覆盖”，所以会继承全局；需要明确关闭时使用 `hint: false`。

### 动态提示只求最终内容

```ts
hint: ({ row, value }) => {
  if (!row.canEdit) return '当前状态不可编辑'
  return `已填写 ${value || 0}，最多可填写 ${row.availableAmount}`
}
```

如果某种状态需要继承全局，返回空值；如果需要退出 Hint 系统，返回 `false`：

```ts
hint: ({ row }) => {
  if (row.hideHelp) return false
  return row.useSpecialHelp ? '字段自己的说明' : null
}
```

## 全局字段格式化

当大量字段的提示都是“当前完整值”时，在表级配置一次即可：

```ts
const hintOptions: FormTableHintOptions<OrderRow> = {
  mode: 'tooltip',
  field: ({ value, fieldKey, itemConfig }) => {
    if (value == null || value === '') return null
    if (fieldKey === 'amount') return `¥${Number(value).toFixed(2)}`
    if (itemConfig.type === 'date') return formatDate(value)
    return String(value)
  }
}
```

字段可以按需继承、关闭或覆盖：

```ts
{ fieldKey: 'remark', type: 'input' }                    // 继承全局
{ fieldKey: 'password', type: 'input', hint: false }     // 关闭
{ fieldKey: 'status', type: 'select', hint: '审批状态' } // 覆盖
```

Select、日期、级联选择和对象字段的内部值不一定等于展示文本。FormTable 不猜测 label，应在 formatter 或字段 Hint 中显式映射：

```ts
hint: ({ value }) =>
  statusOptions.find(option => option.value === value)?.label || null
```

全局 formatter 接收基础 `FormTableFieldRenderContext`；它用于生成 Hint，不读取解析后的 `hint` 或 component 配置，从而避免自引用。

## `title` 与 Hint 的关系

`headerProps.title`、`formItemProps.title` 和 `component.props.title` 都仍是普通透传配置。FormTable 不修改这些源配置对象，只在生成渲染属性时处理同层冲突。

统一规则是：

> 只有最终有效的 `behavior: 'auto'` Hint 会影响同层渲染属性；其他情况原样透传底层 props。

| 最终 Hint | `mode` | 同层 title 的渲染结果 |
| --- | --- | --- |
| 有效 `auto` Hint | `title` | 使用 Hint 内容取代原 title |
| 有效 `auto` Hint | `tooltip` | 不输出 title，改用内部 Tooltip 标记 |
| `custom` | 任意 | 保留原 title |
| `null` / 字段 `false` | 任意 | 保留原 title |

例如：

```ts
{
  fieldKey: 'remark',
  hint: false,
  formItemProps: { title: '原生字段外层 title' }
}
```

这里 `hint: false` 只关闭 Hint，不删除 `formItemProps.title`。以后动态切换为 `auto` Hint 时，渲染结果暂时由 Hint 取代；切回 `false`、`custom`，或最终解析结果变为 `null` 后，原始 title 会自然恢复。注意：Item 返回空值会先尝试继承全局 formatter，只有全局也没有产生内容时，最终结果才是 `null`。

`component.props.title` 属于实际业务组件，不与字段外层 Hint 直接竞争；它最终落在哪个内部节点，取决于组件如何透传 `$attrs`。

## `title` 与 `tooltip` 两种模式

### 原生 title（默认）

```ts
const hintOptions = { mode: 'title' }
```

- 不创建 FormTable Tooltip 实例。
- 浏览器负责样式、位置和出现时机。
- 适合配置最少、无统一视觉要求的场景。

不配置 `hintOptions` 时同样使用此模式。

### 单实例 Tooltip

```ts
const hintOptions = {
  mode: 'tooltip',
  props: {
    placement: 'top',
    effect: 'dark',
    openDelay: 150,
    popperClass: 'form-table-help'
  }
}
```

- 每个 FormTable 只有一个 `el-tooltip`，表头和字段共享。
- 事件委托根据当前悬停或聚焦目标更新内容和锚点。
- Hover 优先于 focus；Hover 离开后会恢复仍处于焦点中的字段提示。
- 嵌套 FormTable 按最近实例隔离，内层目标不会同时激活外层 Tooltip。
- `content/reference/popper/manual/value/enterable` 由 FormTable 管理，外部配置不会覆盖这些内部属性。

Tooltip 模式不会检测文字是否溢出；只要最终 Hint 非空就可以显示。

## `behavior: 'custom'`：把展示交给调用方

普通情况不需要写 `behavior`。只有提示需要独立图标、富文本、点击逻辑或业务组件内部布局时，才使用 `custom`：

```ts
{
  fieldKey: 'amount',
  type: 'slot',
  hint: ({ row }) => ({
    content: `最大可填写 ${row.availableAmount} 元`,
    behavior: 'custom'
  }),
  component: { renderer: 'amount-editor' }
}
```

字段 Slot 会获得标准化后的 `hint`：

```vue
<template #amount-editor="{ value, setValue, hint }">
  <el-input :value="value" @input="setValue" />
  <el-tooltip v-if="hint" :content="hint.content">
    <button type="button" aria-label="查看金额填写说明">?</button>
  </el-tooltip>
</template>
```

`custom` 的准确含义是：FormTable 解析并传递内容，但不写 title、内部 Tooltip 标记或 ARIA，也不占用表级 Tooltip。原始 `formItemProps/headerProps` 保持透传。

### 业务组件显式映射

component 的动态 `resolveRenderer/props/options/optionProps` 和 listener 都能读取同一份最终 `hint`。FormTable 不会把 Hint 隐式注入业务组件 props：

```ts
component: {
  renderer: AddressEditor,
  props: ({ hint }) => ({
    helpText: hint?.content,
    showHelp: hint?.behavior === 'custom'
  })
}
```

如果只需要 FormTable 在组件外层自动提示，保留默认 `auto` 即可，无需映射。

### 自定义表头

`headerSlot` 外仍有 FormTable 提供的统一包装节点。普通文本提示继续配置 `headerHint`，FormTable 会自动应用；只有图标需要成为独立触发点时才使用 `custom`，并从 `header.hint.content` 读取内容。详见[自定义表头](./custom-header.md)。

## 键盘与 ARIA

Tooltip 模式下：

- 托管且内容非空的默认表头自动获得 `tabindex="0"`。
- 显式 `headerProps.tabindex` 优先；Header Slot 已包含按钮等焦点元素时，可设为 `-1` 避免重复 Tab 停靠点。
- 字段聚焦时，`aria-describedby` 会加到实际焦点元素；已有描述 ID 会保留。
- 鼠标悬停时，描述关系应用到 Tooltip 锚点。
- 按 `Escape` 关闭当前 Tooltip；指针或焦点下一次有效迁移后才会重新打开。

使用 `behavior: 'custom'` 后，这些可访问性责任也交给调用方。自定义触发节点至少应可聚焦，并具有可理解的文本或 `aria-label`。

## 场景选型

| 场景 | 推荐方案 |
| --- | --- |
| 少量固定补充说明 | 直接写 `hint: '...'` |
| 大量字段展示自身完整值 | `hintOptions.field: true` |
| 金额、日期、枚举统一转换 | `hintOptions.field: formatter` |
| 某字段不参与全局提示 | Item `hint: false` |
| 提示依赖行数据或权限 | Item 动态 `hint` 回调 |
| 全表需要统一视觉、位置和延迟 | `hintOptions.mode: 'tooltip'` |
| Slot 内独立图标或特殊交互 | `{ content, behavior: 'custom' }` |
| 业务组件内部需要帮助文案 | 从解析上下文显式映射 component props |
| 纯展示单元格文本截断 | `column.props.showOverflowTooltip` |
| 必填、错误或关键操作信息 | 常驻文本、校验消息或可聚焦控件 |

## 能力边界

- Hint 只承载补充说明，不能作为必填状态、校验错误或关键操作说明的唯一入口。
- 整表只能选择一种自动展示模式，不支持字段级 `mode`。
- Hint 内容限定为字符串；富文本和特殊触发节点使用 `behavior: 'custom'` + Slot。
- 不提供点击触发、移动端专用交互或内容溢出检测。
- `column.props.renderHeader` 表示 Element UI 完全接管表头，FormTable 不包装，也不应用 `headerProps/headerHint`。
- `showOverflowTooltip` 解决展示单元格文字截断；Hint 表达业务补充说明，两者用途不同。

## 相关文档

[FormTable Props](../api/form-table.md) · [Column / Row / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md) · [自定义表头](./custom-header.md)
