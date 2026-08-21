# 复合字段映射

一个日期范围、地址、人员或金额组件经常需要同时读取和更新多个行字段。`binding.map` 为这种结构一致、仅路径不同的场景提供可序列化映射；需要计算、异步或副作用时继续使用 `model: false + props + listeners/updateRow`。

> 可运行 Demo：[复合字段映射 ↗](http://localhost:5173/composite-binding)

## 数组值

日期范围组件接收数组，但行数据分别保存开始和结束日期：

```ts
{
  fieldKey: 'startDate',
  binding: {
    map: [
      { fieldPath: 'startDate', valuePath: '[0]' },
      { fieldPath: 'endDate', valuePath: '[1]' }
    ]
  },
  type: 'date',
  component: {
    props: { type: 'daterange', valueFormat: 'yyyy-MM-dd' }
  }
}
```

读取时 FormTable 生成 `[row.startDate, row.endDate]`；组件更新后生成一个包含两个字段路径的 patch，并只调用一次 `updateRow()`。

## 对象与嵌套路径

`fieldPath` 和 `valuePath` 都支持点路径和数组下标：

```ts
binding: {
  map: [
    { fieldPath: 'owner.id', valuePath: 'selection.code' },
    { fieldPath: 'owner.name', valuePath: 'selection.label' }
  ]
}
```

自定义组件仍通过 `component.model` 声明 prop/event。`valueFromEvent` 先从原始事件参数提取组件值，随后 `binding.map` 再将该值转换为行 patch。

## 字段 Slot

字段上下文始终提供 `bindingValue/setBindingValue`。未配置映射时它们等同于 `value/setValue`；配置后可直接绑定复合值：

```vue
<template #contact-editor="{ bindingValue, setBindingValue }">
  <ContactEditor
    :value="bindingValue"
    @input="setBindingValue"
  />
</template>
```

`type: 'slot'` 不会猜测 Slot 内控件的 model 协议，仍由模板显式绑定。

## 写回和清空语义

- 一次 `setBindingValue()` 最多发出一次 `update:tableData`，每个实际变化字段分别发出 `field-change`。
- 组件值中不存在的 `valuePath` 跳过；明确存在的 `undefined/null` 原样写回。
- 组件根值为 `null` 时，所有映射字段统一写为 `null`；空数组或空对象按“路径不存在”处理。
- 空路径、不安全路径、重复或父子重叠路径、混用对象根与数组根都会作为无效配置拒绝。

## 校验边界

`fieldKey` 仍然必填，并且是当前 Item 唯一的 `el-form-item.prop`、Hint 值和校验锚点。映射到的其他字段会正常产生数据更新事件，但不会自动创建额外 FormItem；需要分别展示多个错误时应拆分成多个 Item 或自行组合 Slot。

## 复杂转换

映射数组只表达路径对应关系，不提供格式化、条件、默认值或异步转换。此类场景使用已有回调：

```ts
component: {
  is: BusinessSelector,
  model: false,
  props: ({ row }) => ({ value: createBusinessValue(row) }),
  listeners: {
    change({ updateRow }, value) {
      updateRow(createBusinessPatch(value))
    }
  }
}
```

远程 Schema 可以保存经过白名单校验的 `binding.map`；函数、组件对象和事件处理仍由可信前端代码提供。
