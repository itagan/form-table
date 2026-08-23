# 复合字段映射

一个日期范围、地址、人员或金额组件经常需要同时读取和更新多个行字段。`binding.map` 为这种结构一致、仅路径不同的场景提供可序列化映射；同步格式转换可组合 `model.valueToProp/valueFromEvent`，异步或副作用继续使用 Adapter、listener 或 Slot。

> 可运行 Demo：[复合字段映射 ↗](http://localhost:5173/composite-binding)

## 如何选择

`binding.map` 是声明式的路径投影，不是通用的数据转换器。可以按下面的边界选择：

| 场景 | 建议方式 |
| --- | --- |
| 对象属性分别对应多个行字段，如 `selection.id/name` | `binding.map` |
| 固定数组项分别对应多个行字段，如 `[0]/[1]` | `binding.map` |
| 远程 Schema 需要描述可序列化的路径对应关系 | `binding.map` |
| 组件值与映射对象还需同步格式转换 | `binding.map + model.valueToProp/valueFromEvent` |
| 遍历数组并提取、拼接、过滤或去重，如 `users[].id → ids` | 简单纯转换使用 model 转换；跨字段更新使用 listener |
| 异步处理或额外业务副作用 | Adapter、listener 或字段 Slot |
| 一个字段区域需要自行组合多个控件或布局 | 字段 Slot；简单路径写回仍可调用 `setBindingValue` |

映射中的每个 `valuePath` 都必须是明确路径，不支持通配符、数组遍历或多个来源聚合。组件返回结构与行字段只是“形状不同、路径固定”时使用映射；需要计算新值时使用事件回调。

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

自定义组件仍通过 `component.model` 声明 prop/event。读取时 `binding.map` 先组合值，`valueToProp` 再转换组件输入；写回时 `valueFromEvent` 先接收只读字段上下文和原始事件参数并提取组件值，随后 `binding.map` 将该值转换为行 patch。

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

映射数组只表达路径对应关系和静态 fallback，不直接执行格式化、条件、数组遍历或异步转换。只改变组件 model 形状时组合同步 `valueToProp/valueFromEvent`；需要更新映射范围外的字段或执行副作用时主动处理组件事件：

```ts
component: {
  is: UserSelector,
  model: false,
  props: ({ row }) => ({ value: row.users }),
  listeners: {
    change({ updateRow }, users = []) {
      updateRow({
        users,
        ids: users.map(user => user.id).join(',')
      })
    }
  }
}
```

远程 Schema 可以保存经过白名单校验的 `binding.map`；函数、组件对象和事件处理仍由可信前端代码提供。
