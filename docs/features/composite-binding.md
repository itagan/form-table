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

## 内置 date 映射开始与结束字段

内置 `type: 'date'` 渲染的是一个 `el-date-picker`。当 `component.props.type` 设置为 `daterange` 或 `datetimerange` 时，它仍然只有一个 model，但 model 值会变成 `[start, end]` 数组。`component.props` 只切换 DatePicker 模式，不会自动把两个行字段组合成组件值，因此需要用 `binding.map` 明确数组位置：

```ts
interface ScheduleRow extends TableRow {
  startDate: string | null
  endDate: string | null
}

const columns = defineFormTableColumns<ScheduleRow>([{
  label: '活动日期',
  formItems: [{
    // 主字段同时作为 FormItem 校验和 Hint 的锚点。
    fieldKey: 'startDate',
    type: 'date',
    binding: {
      map: [
        { fieldPath: 'startDate', valuePath: '[0]', fallbackValue: null },
        { fieldPath: 'endDate', valuePath: '[1]', fallbackValue: null }
      ]
    },
    component: {
      props: {
        type: 'daterange',
        valueFormat: 'yyyy-MM-dd',
        rangeSeparator: '至',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期'
      }
    }
  }]
}])
```

读取时 FormTable 生成 `[row.startDate, row.endDate]` 并交给 DatePicker 的默认 `value` Prop；组件触发默认 `input` 事件后，数组的 `[0]/[1]` 会在一次受控更新中分别写回 `startDate/endDate`。配置 `valueFormat` 后数组项是格式化字符串；不配置时遵循 Element UI DatePicker 的原生值类型，映射机制本身不做日期格式转换。

常见未生效原因是把 `valuePath` 写成 `start/end` 等对象路径，而 `daterange` 实际返回数组；反向映射找不到对应路径时只会处理配置了 `fallbackValue` 的字段。数组映射必须统一使用 `[0]`、`[1]`，不能与对象根路径混用。

清空 DatePicker 时，两个字段分别使用上例的 `null`。如果接口约定空字符串，可把两项的 `fallbackValue` 改为 `''`。开始日期和结束日期需要各自独立校验提示时，应拆成两个 Item；单个范围组件只能以 `fieldKey` 指向的主字段作为 FormItem 校验锚点。

## 自定义组件的数组值

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

## 关闭自动 model 后手动绑定

`model: false` 只关闭 FormTable 对 model Prop 和事件的自动注入，`binding.map` 仍然生效。动态 Props 可读取只读 `bindingValue`，listener 可通过 `setBindingValue` 一次写回映射字段：

```ts
{
  fieldKey: 'employeeId',
  type: 'component',
  binding: {
    map: [
      { fieldPath: 'employeeId', valuePath: 'id' },
      { fieldPath: 'employeeName', valuePath: 'name' }
    ]
  },
  component: {
    is: EmployeePicker,
    model: false,
    props: ({ bindingValue }) => ({ selection: bindingValue }),
    listeners: {
      confirm({ setBindingValue }, employee) {
        setBindingValue(employee)
      }
    }
  }
}
```

这种方式适合组件双向绑定协议不可靠，或需要由一个确认事件原子更新多个字段的场景。稳定且可复用的组件协议仍优先使用自定义 model + `binding.map`。保留自动 model 后又在同一事件 listener 中调用 `updateRow` 会执行第二个 Patch，可能产生第二次 `update:tableData`；仅做回调或副作用则不会。

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
  props: ({ bindingValue }) => ({ value: bindingValue }),
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
