# 事件与 Ref

## 自有事件

| 事件 | 参数 |
| --- | --- |
| `update:tableData` | 更新后的新数组 |
| `field-change` | `{ row, index, fieldKey, value, previousValue }` |

Element Table 的 `row-click`、`selection-change`、`sort-change` 等事件直接透传，参数与 Element UI 一致。

## Slot 上下文

字段 slot 接收：`row`、`index`、`fieldKey`、`propPath`、`value`、`tableData`、`setValue`、`updateRow`。

```vue
<template #actions="{ row, index, updateRow }">
  <el-button @click="updateRow({ enabled: !row.enabled })">切换</el-button>
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
