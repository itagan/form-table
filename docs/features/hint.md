# Hint 提示体系

> 可运行 Demo：[Hint 展示策略 ↗](http://localhost:5173/hint-scenarios)

Hint 是轻量的自动补充说明：字段和表头只提供字符串内容，FormTable 统一决定作用范围与展示方式。复杂内容、独立图标或不同 Tooltip 参数使用字段 Slot / `headerSlot` 自行实现。

## 最小配置

```ts
const columns: ColumnConfig[] = [{
  label: '税号',
  headerHint: '纳税人识别号',
  children: [{ children: [{
    fieldKey: 'taxNumber',
    type: 'input',
    hint: '请输入营业执照上的统一社会信用代码'
  }] }]
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

Tooltip 模式保留嵌套 FormTable 隔离、键盘焦点、Escape 关闭和 `aria-describedby`。`content/reference/popper/manual/value/enterable` 由内部控制，其余 `tooltipProps` 透传。

有效 Hint 会覆盖同层 `headerProps.title` 或 `formItemProps.title`；没有有效 Hint、被作用范围排除或整个系统关闭时，原始 title 保持不变。

## 自定义提示

Hint 不再作为业务元数据传播到 renderer、组件 props/listener 或 Slot 上下文。需要富文本、独立触发点或字段与表头使用不同 Tooltip 参数时，关闭对应自动 Hint 并由 Slot 直接根据业务数据实现：

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
- `showOverflowTooltip` 解决文字截断；Hint 表达业务说明，两者用途不同。
- 同一 FormTable 的自动字段和表头共享一组 `tooltipProps`；参数不同使用 Slot。

相关文档：[FormTable Props](../api/form-table.md) · [Column / Row / Item](../api/columns.md) · [Slot 与上下文](../api/contexts.md) · [自定义表头](./custom-header.md)
