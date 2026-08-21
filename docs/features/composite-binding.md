# 复合字段映射

一个日期范围、地址、人员或金额组件经常需要同时读取和更新多个行字段。`binding.map` 为这种结构一致、仅路径不同的场景提供可序列化映射；需要计算、异步或副作用时继续使用 `model: false + props + listeners/updateRow`。

> 可运行 Demo：[复合字段映射 ↗](http://localhost:5173/composite-binding)

## 数组值

自定义日期范围组件通过 `range/range-change` 提供数组值，但行数据分别保存开始和结束日期：

```ts
{
  fieldKey: 'startDate',
  binding: {
    map: [
      { fieldPath: 'startDate', valuePath: '[0]', fallbackValue: '' },
      { fieldPath: 'endDate', valuePath: '[1]', fallbackValue: '' }
    ]
  },
  type: 'component',
  component: {
    is: DateRangePicker,
    model: { prop: 'range', event: 'range-change' }
  }
}
```

FormTable 会向组件的 `range` Prop 注入 `[row.startDate, row.endDate]`，监听 `range-change` 后生成一个包含两个字段路径的 patch，并只调用一次 `updateRow()`。这与普通单字段自定义组件的 model 配置方式相同，区别只是注入和接收的值由 `binding.map` 负责拆装。

## 对象与嵌套路径

`fieldPath` 和 `valuePath` 都支持点路径和数组下标：

```ts
binding: {
  map: [
    { fieldPath: 'owner.id', valuePath: 'selection.code', fallbackValue: '' },
    { fieldPath: 'owner.name', valuePath: 'selection.label', fallbackValue: '未命名' }
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
- 组件值中不存在的 `valuePath` 优先使用该映射项的 `fallbackValue`；未配置时跳过。
- 明确存在的 `undefined/null` 是组件实际返回值，不会被 fallback 替换。
- 组件根值为 `null` 时，有 fallback 的字段使用 fallback，未配置的字段写为 `null`；根 `undefined`、空数组或空对象只处理配置了 fallback 的字段。
- 数组和普通对象 fallback 在每次写回前浅复制，避免不同字段或数据行共享同一个容器根引用。
- 空路径、不安全路径、重复或父子重叠路径、混用对象根与数组根都会作为无效配置拒绝。

```ts
binding: {
  map: [
    { fieldPath: 'userId', valuePath: 'id', fallbackValue: '' },
    { fieldPath: 'userName', valuePath: 'name', fallbackValue: '未命名' },
    { fieldPath: 'departmentIds', valuePath: 'departments', fallbackValue: [] },
    { fieldPath: 'phone', valuePath: 'phone' }
  ]
}
```

组件清空并发出 `null` 时，前三项分别写入 `''/'未命名'/[]`，未配置 fallback 的 `phone` 写入 `null`。组件发出 `{ id: null }` 时，`userId` 明确写入 `null`，其余缺失路径再分别采用 fallback 或跳过。

## 校验边界

`fieldKey` 仍然必填，并且是当前 Item 唯一的 `el-form-item.prop`、Hint 值和校验锚点。映射到的其他字段会正常产生数据更新事件，但不会自动创建额外 FormItem；需要分别展示多个错误时应拆分成多个 Item 或自行组合 Slot。

## 复杂转换

映射数组只表达路径对应关系和静态 fallback，不提供格式化、条件或异步转换。此类场景使用已有回调：

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
