# 数据更新与受控回写

> 可运行 Demo：[`cellSlot` 更新助手 ↗](http://localhost:5173/cell-slot) · [行列操作与延迟提交 ↗](http://localhost:5173/row-column-operations)

`tableData` 是 FormTable 唯一的数据源。根组件 `v-model` 映射到 `tableData/update:tableData`；组件内部不会直接修改传入数组，字段输入、`setValue` 和 `updateRow` 都会生成新数组交给父组件。

## 基础配置

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  @field-change="handleFieldChange"
/>
```

```ts
function handleFieldChange(event) {
  console.log(event.fieldKey, event.previousValue, event.value)
}
```

`v-model="tableData"` 与 `:table-data.sync="tableData"` 等价。需要在回写时附加后端保存等逻辑时，改用显式事件；本地状态仍必须先同步：

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  @update:tableData="handleTableDataUpdate"
/>
```

后端保存可以独立防抖：

```ts
function handleTableDataUpdate(nextTableData) {
  tableData.value = nextTableData
  scheduleSave(nextTableData)
}
```

## 选择更新方式

| 需求 | 更新入口 | 可用位置 | 组件是否发出事件 |
| --- | --- | --- | --- |
| 标准字段输入 | 自动 model | 内置类型、`type: 'component'` | `update:tableData` + `field-change` |
| 更新当前字段 | `setValue(nextValue)` | 字段 listener、字段 Slot | `update:tableData` + 当前字段的 `field-change` |
| 同时更新当前行多个字段 | `updateRow(patch)` | 字段 listener、字段 Slot、`cellSlot` | 一次 `update:tableData` + 每个变化字段的 `field-change` |
| 新增、删除、复制、排序行 | 替换父组件 `tableData` | 页面业务层 | 不经过 FormTable，不自动发出上述事件 |
| 服务端刷新整表 | 替换父组件 `tableData` | 页面业务层 | 不经过 FormTable，不自动发出上述事件 |

## setValue：更新当前字段

配置式组件 listener 的第一个参数包含 `setValue`：

```ts
component: {
  model: false,
  listeners: {
    change({ value, setValue }, nextValue) {
      console.log('修改前', value)
      setValue(nextValue)
    }
  }
}
```

字段 Slot 同样可以使用：

```vue
<template #score-editor="{ value, setValue }">
  <el-input-number :value="value" @input="setValue" />
</template>
```

`setValue` 始终更新当前 Item 的 `fieldKey`，包括 `profile.city` 和 `items[0].name` 等嵌套路径。

## updateRow：批量更新当前行

```ts
component: {
  listeners: {
    select({ updateRow }, user) {
      updateRow({
        ownerId: user.id,
        ownerName: user.name,
        'audit.touched': true
      })
    }
  }
}
```

patch 的 key 支持嵌套路径。相同值会跳过；所有字段都未变化时，不发出 `update:tableData` 或 `field-change`。

字段路径不允许包含 `__proto__`、`prototype` 或 `constructor` 片段；组件会立即抛出包含完整路径的错误，避免配置穿透对象原型链。缺失的嵌套结构会按路径创建，`items[0].name` 中的 `items` 会创建为数组。

`cellSlot` 只提供 `updateRow`，因为它没有明确的 `fieldKey`：

```vue
<template #row-actions="{ row, updateRow }">
  <el-button @click="updateRow({ enabled: !row.enabled })">
    切换状态
  </el-button>
</template>
```

## 连续更新

同一同步调用链中可以组合两个助手，后一次更新会基于前一次结果继续合并：

```ts
change({ setValue, updateRow }, nextValue) {
  setValue(nextValue)
  updateRow({ touched: true })
}
```

父组件仍可能收到多次 `update:tableData`，因此立即回写协议不能省略。

## 页面直接更新

行操作属于业务数据管理，直接替换父组件状态：

```ts
function addRow() {
  tableData.value = [...tableData.value, createEmptyRow()]
}

function removeRow(id) {
  tableData.value = tableData.value.filter(row => row.id !== id)
}

function updateFromServer(nextRows) {
  tableData.value = nextRows
}
```

这些更新不是由 FormTable 发起，因此不会自动产生 `update:tableData` 或 `field-change`。需要统一审计时，在页面的数据服务层记录，而不是等待组件事件。

## 异步更新

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :table-props="{ rowKey: 'id' }"
/>
```

```ts
async function approve({ row, updateRow }) {
  await saveApproval(row.id)
  updateRow({ status: 'approved' })
}
```

异步等待期间行可能排序、插入或被服务端新对象替换。配置唯一稳定的 `rowKey` 后，更新助手会在最新 `tableData` 中重新定位原行；目标不存在或 key 重复时忽略更新。详见[稳定身份与异步安全](./stable-identity.md)。

`rowKey` 是不可变的行身份。`setValue` 或 `updateRow` 一旦尝试改变字符串路径、嵌套路径或函数型 `rowKey` 的返回值，整个 patch 会被拒绝，不产生任何更新事件；行身份变更应由页面业务层替换 `tableData` 完成。

## 常见错误

- 直接执行 `row.name = '新值'`：绕过受控回写和字段事件。
- 防抖 `update:tableData`：后续编辑可能基于旧 props 覆盖前一次结果。
- 异步结束后使用旧 `index` 修改数组：行排序后可能写错目标。
- 用 `setValue` 更新其他字段：应改用 `updateRow`。
- 通过 `updateRow` 修改 `rowKey`：行身份必须由页面业务层维护。
