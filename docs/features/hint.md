# Hint 提示体系

> 可运行 Demo：[Hint 展示策略 ↗](http://localhost:5173/hint-scenarios)

Hint 是轻量的自动补充说明：字段和表头只提供字符串内容，FormTable 统一决定作用范围与展示方式。复杂内容、独立图标或不同 Tooltip 参数使用字段 Slot / `headerSlot` 自行实现。

## 最小配置

```ts
const columns: ColumnConfig[] = [{
  label: '税号',
  headerHint: '纳税人识别号',
  formItems: [{
    fieldKey: 'taxNumber',
    type: 'input',
    hint: '请输入营业执照上的统一社会信用代码'
  }]
}]
```

默认配置等价于：

```ts
{ mode: 'title', targets: 'field' }
```

因此默认只自动展示字段 Hint；若要启用表头，显式设置 `targets: 'header'` 或 `targets: 'all'`。

## hintOptions

```ts
interface FormTableHintOptions<TRow> {
  mode?: false | 'title' | 'tooltip'
  targets?: 'field' | 'header' | 'all'
  field?: boolean | FormTableFieldHintFormatter<TRow>
  tooltipProps?: ComponentProps
}
```

| 配置 | 默认 | 作用 |
| --- | --- | --- |
| `mode` | `'title'` | `false` 完全关闭；`title` 使用浏览器提示；`tooltip` 使用单实例 Element Tooltip |
| `targets` | `'field'` | 控制自动处理字段、表头或两者 |
| `field` | `false` | 未显式提供字段 Hint 时的默认内容 |
| `tooltipProps` | `{}` | 仅 Tooltip 模式生效，透传给唯一的 `el-tooltip` |

作用范围：

| targets | 字段 Hint | headerHint |
| --- | --- | --- |
| `field` | 求值并展示 | 不求值 |
| `header` | 不求值 | 求值并展示 |
| `all` | 求值并展示 | 求值并展示 |

被排除的目标不会求值动态 Hint，也不会添加 `title` 或内部标记。

## 字段内容规则

Item `hint` 接受静态值或字段上下文回调，结果为 `string | false | null | undefined`：

| 结果 | 行为 |
| --- | --- |
| 非空字符串 | 覆盖全局字段默认内容 |
| `false` | 明确关闭当前字段 Hint |
| `null` / `undefined` / `''` | 回退到 `hintOptions.field` |

`hintOptions.field: true` 对非空值执行 `String(value)`；formatter 可以根据 `row/value/fieldKey/itemConfig` 返回字符串或关闭值。

```ts
const hintOptions: FormTableHintOptions<OrderRow> = {
  mode: 'tooltip',
  targets: 'field',
  field: ({ value, fieldKey }) => {
    if (value == null || value === '') return false
    if (fieldKey === 'amount') return `¥${Number(value).toFixed(2)}`
    return String(value)
  },
  tooltipProps: { placement: 'right', openDelay: 150 }
}
```

表头不继承字段 formatter，必须显式配置 `headerHint`。

## 三种模式

- `mode: false`：不求值 Hint、不创建标记、不挂载 Tooltip 控制器或事件监听。
- `mode: 'title'`：只向有效目标添加原生 `title`，不挂载 Tooltip 控制器。
- `mode: 'tooltip'`：每个 FormTable 仅挂载一个 Tooltip，通过根节点事件委托服务所有有效目标。

Tooltip 模式内部默认使用 `placement: 'top'`、`effect: 'dark'` 和 `openDelay: 100`，减少鼠标快速扫过字段时的闪烁；同名 `tooltipProps` 会覆盖这些展示默认值。字段默认仍由整个 `el-form-item` 统一触发，但浮层会优先定位到唯一且可见的实际组件根节点，使 InputNumber、Switch、Rate 等未铺满字段区域的组件保持自然的视觉位置；多根 Slot、空内容或零尺寸节点会回退到 `el-form-item`。嵌套 FormTable 隔离、键盘焦点、Escape 关闭和 `aria-describedby` 保持有效。`content/reference/popper/manual/value/enterable` 由内部控制，其余属性透传。

## 字段触发区域

Item `hintTrigger` 可以把紧凑字段的触发区域收敛到实际内容：

```ts
{
  fieldKey: 'enabled',
  type: 'switch',
  hint: '是否启用',
  hintTrigger: 'content'
}
```

`item` 是默认值，整个 `el-form-item` 都可触发；`content` 使用 `.el-form-item__content` 中唯一可见、非零尺寸的直接根节点。Tooltip 模式下该节点同时作为触发区域和定位锚点；找不到或存在多个有效根节点时回退到 `el-form-item`，并在开发环境按字段和失败原因去重警告。内容结构变化后会重新解析。

Title 模式下，`content` 不再向 FormItem 添加自动 title，而是在 `component.props.title` 未声明时注入 Hint；显式组件 title 优先。内置组件和 `type: 'text'` 会直接应用，自定义组件需要让 title 落到实际 DOM。字段 Slot 需要把解析后的 props 绑定到单根节点：

```vue
<template #enabled="{ component }">
  <el-switch v-bind="component.props" />
</template>
```

有效 Hint 会覆盖同层 `headerProps.title` 或 `formItemProps.title`；没有有效 Hint、被作用范围排除或整个系统关闭时，原始 title 保持不变。

## 自定义提示

Hint 不作为业务元数据传播到 `component.is`、listener 或动态配置回调；仅 `hintTrigger: 'content'` 的 title 模式会把自动 title 合并进解析后的 `component.props`。需要富文本、独立图标或字段与表头使用不同 Tooltip 参数时，关闭对应自动 Hint 并由 Slot 直接根据业务数据实现：

```vue
<template #amount-header="{ label }">
  <el-tooltip content="含税金额" placement="top">
    <span>{{ label }}</span>
  </el-tooltip>
</template>
```

字段 Slot 已有 `row/value/setValue`，可以直接计算自己的提示内容。表头数量较少，独立 Tooltip 不会造成单元格级的大量实例开销。

## 边界

- Hint 只承载补充说明，不能代替校验错误、必填状态或关键操作说明。
- `column.props.renderHeader` 完全接管表头，FormTable 不应用 `headerProps/headerHint`。
- 纯文本列或展示型 `cellSlot` 的内容截断使用 `column.props.showOverflowTooltip`；表单字段的业务说明使用 Item `hint`。
- 同一字段列不建议同时启用 `showOverflowTooltip` 和 Hint，否则两个 Tooltip 可能重叠或闪烁；FormTable 不扫描、删除或改写透传属性。
- 同一 FormTable 的自动字段和表头共享一组 `tooltipProps`；参数不同使用 Slot。

相关文档：[FormTable Props](../api/form-table.md) · [Column / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md) · [自定义表头](./custom-header.md)
