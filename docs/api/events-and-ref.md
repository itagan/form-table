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

```vue
<template #actions="{ row, index, updateRow, component }">
  <el-button v-bind="component.props" @click="updateRow({ enabled: !row.enabled })">切换</el-button>
  <el-button @click="removeRow(index)">删除</el-button>
</template>
```

## Ref

```ts
await formTableRef.value?.validate()
formTableRef.value?.resetFields()
formTableRef.value?.clearValidate()
formTableRef.value?.getFormRef()
formTableRef.value?.getTableRef()
```

行增删、复制、移动由调用方直接维护 `tableData`。
