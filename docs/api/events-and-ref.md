# 事件与 Ref

## 自有事件

| 事件 | 参数 |
| --- | --- |
| `update:tableData` | 更新后的新数组 |
| `field-change` | `{ row, index, fieldKey, value, previousValue }` |

Element Table 的 `row-click`、`selection-change`、`sort-change` 等事件直接透传，参数与 Element UI 一致。

## Slot 上下文

字段 slot 接收：`row`、`index`、`fieldKey`、`propPath`、`value`、`tableData`、`setValue`、`updateRow`、`component`。其中 `component` 保持配置字段名称，包含解析后的 `renderer/props/listeners/options/optionProps`。

配置式组件事件保持组件原始参数顺序，并在最前面增加字段上下文：

```ts
component: {
  listeners: {
    xx(fieldContext, arg1, arg2) {
      fieldContext.updateRow({ touched: true })
    }
  }
}
```

如果组件执行 `$emit('xx', arg1, arg2)`，回调即收到 `fieldContext, arg1, arg2`。上下文不会包含 Column/Row 层不存在的占位字段。

上下文中的 `value` 是事件回调执行时的当前字段值，不等同于组件刚刚发出的新值；新值仍按组件原始事件参数传入。

```ts
component: {
  listeners: {
    change({ row, index, fieldKey, value, setValue, updateRow }, nextValue) {
      console.log('当前数据行', row)
      console.log('数据下标与字段', index, fieldKey)
      console.log('修改前字段值', value)

      setValue(nextValue)
      updateRow({ touched: true })
    }
  }
}
```

`setValue` 与 `updateRow` 可以在同一同步回调中连续调用，后一次更新会基于前一次结果继续合并。跨异步边界后则始终以父组件最新传回的 `tableData` 为准。

```vue
<template #actions="{ row, index, updateRow, component }">
  <el-button
    v-bind="component.props"
    v-on="component.listeners"
    @click="updateRow({ enabled: !row.enabled })"
  >切换</el-button>
  <el-button @click="removeRow(index)">删除</el-button>
</template>
```

`component.listeners` 中的函数已经自动注入字段上下文。Slot 内只有显式使用 `v-on="component.listeners"`，自定义组件发出的同名事件才会进入配置 listener；FormTable 不会替 Slot 自动绑定。

`row` 和 `tableData` 是原数据的只读视图约定：TypeScript 提供浅层只读限制，运行时不会冻结对象。请勿直接赋值，统一使用更新助手。

## Ref

```ts
await formTableRef.value?.validate()
formTableRef.value?.resetFields()
formTableRef.value?.clearValidate()
formTableRef.value?.getFormRef()
formTableRef.value?.getTableRef()
```

行增删、复制、移动由调用方直接维护 `tableData`。
