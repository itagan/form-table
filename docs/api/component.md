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

## 内置类型映射

内置 `type` 只映射 Element UI 已提供的组件，不包含 Tree Select 等业务或第三方组件：

| `type` | 实际组件 | 自动补充属性 |
| --- | --- | --- |
| `input` | `el-input` | — |
| `select` | `el-select` | — |
| `date` | `el-date-picker` | `{ type: 'date' }` |
| `datetime` | `el-date-picker` | `{ type: 'datetime' }` |
| `time` | `el-time-picker` | — |
| `textarea` | `el-input` | `{ type: 'textarea' }` |
| `number` | `el-input-number` | — |
| `switch` | `el-switch` | — |
| `radio` | `el-radio-group` | — |
| `checkbox` | `el-checkbox-group` | — |
| `text` | `span` | — |
| `rate` | `el-rate` | — |
| `slider` | `el-slider` | — |
| `color` | `el-color-picker` | — |
| `upload` | `el-upload` | — |
| `cascader` | `el-cascader` | — |
| `autocomplete` | `el-autocomplete` | — |

`component.props` 会在自动补充属性之后合并，因此可以覆盖或扩展这些最小默认值。需要其他组件时使用 `type: 'component'`。

从最小配置到页面使用的独立示例见[自定义字段组件](../features/custom-component.md)。Render Function 和更多组合方式见[完整配置指南](../guide/configuration-guide.md)，完整企业组件 Mock 与 columns 工厂见[企业复杂组件接入示例](../examples/enterprise-components.md)。
