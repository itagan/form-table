# Component 配置

## 完整路径

```text
columns[].formItems[].component
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
| `columns[].formItems[].component.renderer` | `string \| Component` | `component` / `slot` | — | component 为组件；slot 为具名 Slot |
| `...component.resolveRenderer` | `(ItemContext) => string \| Component \| undefined` | 仅 `component` | ItemContext | 按当前行同步选择组件 |
| `...component.model` | `false \| FieldModelConfig` | 内置 / `component` | — | 省略时使用原生 v-model；也可自定义或关闭绑定 |
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

`...` 在表格中缩写了共同前缀 `columns[].formItems[]`。

## 渲染模式约束

| `type` | renderer 约束 | model 行为 |
| --- | --- | --- |
| 内置类型 | 由 FormTable 映射，不接受自定义 renderer | 默认双向绑定 |
| `component` | 必须提供 `renderer` 或 `resolveRenderer` | 默认 Vue 2 v-model，可自定义 |
| `slot` | `renderer` 必须是静态 Slot 名称 | FormTable 不为 Slot 内组件自动绑定 |

## 内置类型映射

内置 `type` 只映射适合字段默认 v-model 协议的 Element UI 组件族，不包含 Tree Select、Upload 等复杂组件：

| `type` | 实际组件 |
| --- | --- |
| `input` | `el-input` |
| `select` | `el-select` |
| `date` | `el-date-picker` |
| `time` | `el-time-picker` |
| `number` | `el-input-number` |
| `switch` | `el-switch` |
| `radio` | `el-radio-group` |
| `checkbox` | `el-checkbox-group` |
| `text` | `span` |
| `rate` | `el-rate` |
| `slider` | `el-slider` |
| `color` | `el-color-picker` |
| `cascader` | `el-cascader` |
| `autocomplete` | `el-autocomplete` |

具体组件模式继续使用 Element UI 原生 Prop。多行文本使用 `type: 'input'` 配合 `component.props.type: 'textarea'`；日期时间、范围或月份等使用 `type: 'date'` 配合 DatePicker 的 `type` Prop：

```ts
{ type: 'input', component: { props: { type: 'textarea', rows: 3 } } }
{ type: 'date', component: { props: { type: 'datetime' } } }
{ type: 'date', component: { props: { type: 'daterange' } } }
```

需要其他组件时使用 `type: 'component'`。

## 复杂 Option 接入

结构固定的扁平选项使用 `options + optionProps`，可以继续获得 FormTable 的最小选项渲染：

```ts
{
  fieldKey: 'status',
  type: 'select',
  component: {
    options: statusOptions,
    optionProps: { label: 'name', value: 'code', disabled: 'readonly' }
  }
}
```

选项分组、自定义选项内容、跨字段禁用逻辑等场景改用字段 Slot，直接发挥 Element UI 的 `el-option-group`、`el-option` 和原生属性能力：

```ts
{
  fieldKey: 'cityCode',
  type: 'slot',
  component: {
    renderer: 'city-select',
    props: { clearable: true, filterable: true },
    listeners: {
      change({ row }, value) {
        console.log('城市变化', row, value)
      }
    }
  }
}
```

```vue
<template #city-select="{ row, value, setValue, component }">
  <el-select
    :value="value"
    v-bind="component.props"
    v-on="component.listeners"
    @input="setValue"
  >
    <el-option-group
      v-for="group in cityGroups"
      :key="group.name"
      :label="group.name"
    >
      <el-option
        v-for="city in group.options"
        :key="city.code"
        :label="city.name"
        :value="city.code"
        :disabled="city.disabled || city.country !== row.country"
      >
        <span>{{ city.name }}</span>
        <small>{{ city.code }}</small>
      </el-option>
    </el-option-group>
  </el-select>
</template>
```

`setValue` 负责按当前 `fieldKey` 回写；只有显式绑定 `v-on="component.listeners"` 时，配置 listener 才会接收 Slot 内组件事件。FormTable 不增加 option-group 配置层，也不接管 Element UI 的选项 Slot。

### Upload 接入

`el-upload` 不采用普通字段的 `value/input` 协议，还需要上传触发内容、`file-list`、生命周期回调和请求策略，因此不作为内置 `type`。根据封装程度选择：

- 已有业务上传组件：使用 `type: 'component'`，通过 `component.model` 声明值 prop 和变更事件。
- 直接组合 `el-upload`：使用 `type: 'slot'`，从字段 Slot 获取 `value/setValue/propPath` 并自行绑定上传内容。

```ts
{
  fieldKey: 'attachmentIds',
  type: 'component',
  component: {
    renderer: BusinessAttachmentUploader,
    model: {
      prop: 'fileIds',
      event: 'files-change'
    }
  }
}
```

完整业务上传组件可参考[企业复杂组件接入示例](../examples/enterprise-components.md)。

从最小配置到页面使用的独立示例见[自定义字段组件](../features/custom-component.md)。Render Function 和更多组合方式见[完整配置指南](../guide/configuration-guide.md)，完整企业组件 Mock 与 columns 工厂见[企业复杂组件接入示例](../examples/enterprise-components.md)。
