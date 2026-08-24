# Component 配置

## 完整路径

```text
columns[].formItems[].component
├─ is
├─ resolveComponent
├─ slot
├─ model
│  ├─ prop
│  ├─ event
│  ├─ valueToProp
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
| `columns[].formItems[].component.is` | `string \| Component` | 仅 `component` | — | 对应 Vue 动态组件 `is` 的静态目标；推荐组件对象或全局注册名 |
| `...component.resolveComponent` | `(ItemContext) => string \| Component \| undefined` | 仅 `component` | ItemContext | 按当前行同步选择与 `is` 相同类型的目标 |
| `...component.slot` | `string` | 仅 `slot` | — | 父 FormTable 上的静态具名 Slot |
| `...component.model` | `false \| FieldModelConfig` | 内置 / `component` / 注册 type | — | 省略时按 Vue 2 组件 model 选项绑定；也可自定义或关闭绑定 |
| `...component.model.prop` | `string` | 自定义 model | — | 接收字段值的 prop，默认 `value` |
| `...component.model.event` | `string` | 自定义 model | — | 通知字段变化的事件，默认 `input` |
| `...component.model.valueToProp` | `(context, bindingValue) => FormTableValue` | 自定义 model | 只读字段上下文 + 绑定值 | 将字段值或 `binding.map` 组合值同步转换为组件 model prop |
| `...component.model.valueFromEvent` | `(context, ...args) => FormTableValue` | 自定义 model | 只读字段上下文 + 原始事件参数 | 从事件参数提取写回值；注册 type 可关联事件参数元组 |
| `...component.props` | `DynamicValue<ComponentProps, ItemContext>` | 全部 | ItemContext | 透传实际字段组件 |
| `...component.listeners` | `Record<string, FormTableFieldListener>` | 全部 | ActionContext + 原始事件参数 | 配置式组件事件 |
| `...component.options` | `DynamicValue<FormItemOption[], ItemContext>` | 选项型 | ItemContext | select / radio / checkbox 选项 |
| `...component.optionProps` | `DynamicValue<OptionPropsConfig, ItemContext>` | 选项型 | ItemContext | 选项字段映射 |
| `...component.optionProps.label` | `string` | 选项型 | — | 选项展示字段 |
| `...component.optionProps.value` | `string` | 选项型 | — | 选项值字段 |
| `...component.optionProps.disabled` | `string` | 选项型 | — | 选项禁用字段 |
| `...component.optionProps.key` | `string` | 选项型 | — | 选项渲染 key 字段 |

`...` 在表格中缩写了共同前缀 `columns[].formItems[]`。

Item 级 `binding.map` 位于 `columns[].formItems[].binding`，不属于组件协议。读取顺序是先将多个行字段组合为 `bindingValue`，再由 `valueToProp` 转换为组件 model prop；写回顺序是 `valueFromEvent` 提取组件值，再由映射生成一个行 patch。每个映射项还可通过 `fallbackValue` 声明组件值路径缺失时的静态写回值。对象、数组、Slot、清空和校验规则见[复合字段映射](../features/composite-binding.md)。

`valueToProp` 是同步纯转换函数。首参是只读字段上下文，第二个参数是转换前的 `bindingValue`；上下文中的 `value` 始终是主 `fieldKey` 的原始字段值。异步查询、跨字段更新和副作用应使用 Adapter、listener 或 Slot。`model: false`、字段 Slot 和 `type: 'text'` 不进入自动 model 链，因此不会调用它。

## 渲染模式约束

| `type` | 渲染入口约束 | model 行为 |
| --- | --- | --- |
| 内置类型 | 由 FormTable 映射，不接受 `is/resolveComponent/slot` | 默认双向绑定 |
| `component` | 必须提供 `is` 或 `resolveComponent` | 默认 Vue 2 v-model，可自定义 |
| `slot` | `slot` 必须是静态 Slot 名称 | FormTable 不为 Slot 内组件自动绑定 |
| 注册 type | `is` 来自 `fieldTypes`；Item 仅允许 `props/listeners/model` | 继承注册 model，Item 可整体覆盖 |

注册 type 的默认 props 与字段 props 浅合并，字段优先；Item 不能覆盖 `is` 或使用 `resolveComponent/slot/options/optionProps`。完整注册方式见[自定义字段 Type](../features/custom-field-types.md)。

## `is` 目标与原生标签边界

`component.is` 对应 Vue 动态组件的 `is`，最终目标可以使用两种推荐形式：

```ts
// 页面直接引入的组件对象，包括函数组件
component: { is: UserSelector }

// 已通过 Vue.component 或组件库插件完成全局注册的名称
component: { is: 'corp-user-selector' }
```

字符串目标由 Vue 运行时解析，因此 `input`、`button` 等原生 HTML 标签名也可能创建对应节点。但 `type: 'component'` 的自动绑定面向 Vue 组件协议，不负责原生节点的子内容、`domProps`、不同控件的事件取值或指令级 v-model 编译；原生表单标签不作为完整字段接入方式承诺。

- 标准输入、选择和开关等字段使用内置 `type`。
- 第三方或业务组件使用组件对象或全局注册名。
- 需要原生标签、自定义子内容或复杂 DOM 事件时，使用 `type: 'slot'` 并在模板中显式绑定 `value/setValue`。

`resolveComponent` 返回相同类型的动态目标，并且必须保持同步；返回 `undefined` 时回退到静态 `is`。

## 内置类型映射

内置 `type` 只映射适合字段默认 v-model 协议的 Element UI 组件族，不包含 Tree Select、Upload 等复杂组件：

| `type` | 实际组件 |
| --- | --- |
| `input` | `el-input` |
| `select` | `el-select` |
| `date` | `el-date-picker` |
| `time` | `el-time-picker` |
| `time-select` | `el-time-select` |
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

`type: 'text'` 直接使用 `String(bindingValue ?? '')` 渲染 `span`，不会执行自动 model，也不负责枚举翻译或金额、日期格式化。它适合保留 Item 布局和字段 Hint 的简单详情；不需要 Item Label 时可设置 `formItemProps.label: ''`，根 Form 配置统一 `labelWidth` 时再用 Item `labelWidth: '0'` 清除间距。需要格式化时使用字段 Slot，需要读取多个行字段并接管整格时使用 `cellSlot`。完整选择见[详情与编辑模式](../features/detail-and-editing-modes.md)。

具体组件模式继续使用 Element UI 原生 Prop。多行文本使用 `type: 'input'` 配合 `component.props.type: 'textarea'`；日期时间、范围或月份等使用 `type: 'date'` 配合 DatePicker 的 `type` Prop：

```ts
{ type: 'input', component: { props: { type: 'textarea', rows: 3 } } }
{ type: 'date', component: { props: { type: 'datetime' } } }
{ type: 'date', component: { props: { type: 'daterange' } } }
```

任意时间使用 `time`；按固定步长生成时间列表时使用独立的 `time-select`：

```ts
{
  fieldKey: 'appointmentTime',
  type: 'time-select',
  component: {
    props: {
      pickerOptions: {
        start: '08:00',
        step: '00:30',
        end: '18:00'
      }
    }
  }
}
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
    slot: 'city-select',
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
    is: BusinessAttachmentUploader,
    model: {
      prop: 'fileIds',
      event: 'files-change'
    }
  }
}
```

完整业务上传组件可参考[企业复杂组件接入示例](../examples/enterprise-components.md)。

从最小配置到页面使用的独立示例见[自定义字段组件](../features/custom-component.md)。Render Function 和更多组合方式见[完整配置指南](../guide/configuration-guide.md)，完整企业组件 Mock 与 columns 工厂见[企业复杂组件接入示例](../examples/enterprise-components.md)。
