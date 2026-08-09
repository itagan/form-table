# Component 配置

## 完整路径

```text
columns[].children[].children[].component
├─ renderer
├─ resolveRenderer
├─ model
│  ├─ prop
│  ├─ event
│  └─ valueFromEvent
├─ props
├─ listeners
├─ options
└─ optionProps
   ├─ label
   ├─ value
   ├─ disabled
   └─ key
```

## 属性路径

| 配置路径 | 类型 | 模式 | 动态上下文 | 目标 / 作用 |
| --- | --- | --- | --- | --- |
| `columns[].children[].children[].component.renderer` | `string \| Component` | `component` / `slot` | — | component 为组件；slot 为具名 Slot |
| `...component.resolveRenderer` | `(ItemContext) => string \| Component \| undefined` | 仅 `component` | ItemContext | 按当前行同步选择组件 |
| `...component.model` | `true \| false \| FieldModelConfig` | 内置 / `component` | — | 控制字段值绑定协议 |
| `...component.model.prop` | `string` | 自定义 model | — | 接收字段值的 prop，默认 `value` |
| `...component.model.event` | `string` | 自定义 model | — | 通知字段变化的事件，默认 `input` |
| `...component.model.valueFromEvent` | `(...args) => FormTableValue` | 自定义 model | 原始事件参数 | 从事件参数提取写回值 |
| `...component.props` | `DynamicValue<ComponentProps, ItemContext>` | 全部 | ItemContext | 透传实际字段组件 |
| `...component.listeners` | `Record<string, FormTableFieldListener>` | 全部 | ActionContext + 原始事件参数 | 配置式组件事件 |
| `...component.options` | `DynamicValue<FormItemOption[], ItemContext>` | 选项型 | ItemContext | select / radio / checkbox 选项 |
| `...component.optionProps` | `DynamicValue<OptionPropsConfig, ItemContext>` | 选项型 | ItemContext | 选项字段映射 |
| `...component.optionProps.label` | `string` | 选项型 | — | 选项展示字段 |
| `...component.optionProps.value` | `string` | 选项型 | — | 选项值字段 |
| `...component.optionProps.disabled` | `string` | 选项型 | — | 选项禁用字段 |
| `...component.optionProps.key` | `string` | 选项型 | — | 选项渲染 key 字段 |

`...` 在表格中缩写了共同前缀 `columns[].children[].children[]`。

## 渲染模式约束

| `type` | renderer 约束 | model 行为 |
| --- | --- | --- |
| 内置类型 | 由 FormTable 映射，不接受自定义 renderer | 默认双向绑定 |
| `component` | 必须提供 `renderer` 或 `resolveRenderer` | 默认 Vue 2 v-model，可自定义 |
| `slot` | `renderer` 必须是静态 Slot 名称 | FormTable 不为 Slot 内组件自动绑定 |

完整自定义 model、Render Function 和动态组件示例见 [完整配置指南](../guide/configuration-guide.md)。
