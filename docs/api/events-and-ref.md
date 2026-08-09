# 事件与 Ref

> 按任务阅读：[数据更新与受控回写](../features/data-updates.md) · [校验、清理与重置](../features/validation-reset.md)

## 自有事件

| 事件 | 参数 |
| --- | --- |
| `update:tableData` | 更新后的新数组 |
| `field-change` | `{ row, index, fieldKey, value, previousValue }` |

Element Table 的 `row-click`、`selection-change`、`sort-change` 等事件直接透传，参数与 Element UI 一致。

事件回调与配置回调的参数边界：

| 回调 | 收到的内容 | 是否包含配置上下文 |
| --- | --- | --- |
| `@update:tableData="handler"` | 更新后的 `TableRow[]` | 否 |
| `@field-change="handler"` | `{ row, index, fieldKey, value, previousValue }` | 否 |
| `component.listeners[event]` | `ActionContext, ...组件原始事件参数` | 是 |
| `cellSlot` scoped Slot | `{ row, index, columnConfig, updateRow }` | 是 |
| Element Table 原生事件 | Element UI 原始事件参数 | 否 |

```ts
function handleFieldChange({ row, index, fieldKey, value, previousValue }) {
  console.log('数据变化', row, index, fieldKey, previousValue, value)
}
```

### 受控数据回写协议

`tableData` 是受控数据。日常用法推荐 `v-model="tableData"`，它通过 Vue 2 model 配置复用 `tableData/update:tableData`；`:table-data.sync="tableData"` 仍完全兼容。显式监听事件时，父组件收到新数组后应立即传回 FormTable。同一同步调用链中的连续 `setValue/updateRow` 会基于前一次结果合并；微任务结束后，组件重新以父组件传入的 `tableData` 为准。

因此，不要防抖或异步等待 `update:tableData` 的本地回写，否则后续编辑可能读取旧 props 并覆盖先前结果。接口持久化可以独立防抖：先立即更新本地 `tableData`，再将最新快照交给保存任务。

```ts
function handleTableDataUpdate(nextTableData) {
  tableData.value = nextTableData
  scheduleSave(nextTableData) // 仅后端保存允许延迟
}
```

## Slot 上下文

### 列级 cellSlot

`cellSlot` 直接渲染整个单元格，不经过 Row/Item 字段链路。它的 scope 只提供当前单元格确实可用的内容：

| 字段 | 说明 |
| --- | --- |
| `row` | 当前行的浅只读业务数据 |
| `index` | Slot 渲染时的行下标 |
| `columnConfig` | 当前浅只读 `CellSlotColumnConfig` 原始引用 |
| `updateRow(patch)` | 不可变地更新当前行，patch key 支持嵌套路径 |

```vue
<template #row-actions="{ row, index, columnConfig, updateRow }">
  <span>{{ columnConfig.label }}：{{ row.name }}</span>
  <el-button @click="updateRow({ enabled: !row.enabled })">切换</el-button>
  <el-button @click="removeRow(index)">删除</el-button>
</template>
```

`index` 是渲染快照，适合立即执行的页面操作；异步数据更新应使用已绑定当前行的 `updateRow`，并为表格配置唯一稳定的 `tableProps.rowKey`。`updateRow` 发出 `update:tableData`，并为每个实际变化的 patch 字段发出 `field-change`。

`cellSlot` 不提供 `tableData/columnIndex/fieldKey/value/setValue/rowConfig/itemConfig/propPath/component`。需要字段值、字段校验或已解析组件配置时，应改用 `type: 'slot'` 字段 Slot。

### 字段 Slot

字段 Slot 在 Item 上下文基础上增加更新能力和解析结果：

| 内容 | 字段 |
| --- | --- |
| 数据定位 | `tableData`、`row`、`index`、`fieldKey`、`value` |
| 原始配置 | `columnConfig`、`rowConfig`、`itemConfig` |
| 更新能力 | `setValue`、`updateRow` |
| Slot 专属 | `propPath`、`component` |

其中 `itemConfig.component` 是原始配置，可能仍包含动态函数；`component` 是解析后的 `renderer/props/listeners/options/optionProps`。

因此两者不是替代关系：`itemConfig` 用于读取当前字段的原始配置来源，`component` 用于在 Slot 模板中直接绑定。不要把 `itemConfig.component.props` 直接传给组件，因为它可能仍是一个动态函数。

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
    change({ row, index, fieldKey, value, itemConfig, setValue, updateRow }, nextValue) {
      console.log('当前数据行', row)
      console.log('数据下标与字段', index, fieldKey)
      console.log('事件来源配置', itemConfig.key)
      console.log('修改前字段值', value)

      setValue(nextValue)
      updateRow({ touched: true })
    }
  }
}
```

`setValue` 与 `updateRow` 可以在同一同步回调中连续调用，后一次更新会基于前一次结果继续合并。跨异步边界后始终以父组件最新传回的 `tableData` 为准；配置 `tableProps.rowKey` 后会重新定位触发事件的原数据行。目标行已删除或无法可靠定位时不会发出更新。

```vue
<template #score-editor="{ value, setValue, updateRow, component }">
  <ScoreEditor
    v-bind="component.props"
    v-on="component.listeners"
    :value="value"
    @input="setValue"
  />
  <el-button @click="updateRow({ scoreTouched: true })">标记已编辑</el-button>
</template>
```

`component.listeners` 中的函数已经自动注入字段上下文。Slot 内只有显式使用 `v-on="component.listeners"`，自定义组件发出的同名事件才会进入配置 listener；FormTable 不会替 Slot 自动绑定。

`row` 是当前业务数据行，`rowConfig` 是当前布局行配置。数据和三个 `*Config` 都是浅层只读约定，运行时不会冻结对象。请勿直接赋值：数据修改使用更新助手，配置调整由调用方替换 `columns`。异步回调中持有的是触发时配置引用，不保证异步结束后仍为最新配置。

`field-change` 是纯数据事件，可能来自一次多字段 `updateRow`，也可能对应多个相同 `fieldKey` 的 Item，因此不返回 `columnConfig/rowConfig/itemConfig`。

## Ref

```ts
await formTableRef.value?.validate()
formTableRef.value?.resetFields()
formTableRef.value?.clearValidate()
formTableRef.value?.getFormRef()
formTableRef.value?.getTableRef()
```

`validate()` 使用 Element UI 完整规则并统一返回 `Promise<boolean>`；校验失败时返回 `false`，不会要求调用方捕获 rejected Promise。

`resetFields()` 保持 Element UI 原生语义，直接调用 `el-form.resetFields()`。由于 Form model 引用了传入的 `tableData`，原生重置会直接修改对应字段，不会触发 `update:tableData` 或 `field-change`。

受控场景推荐由调用方明确保存和恢复业务初始数据，再清除校验状态：

```ts
const initialTableData = cloneDeep(tableData.value)

const resetTable = async () => {
  tableData.value = cloneDeep(initialTableData)
  await nextTick()
  formTableRef.value?.clearValidate()
}
```

这样可以由新增、编辑等业务场景自行决定是否删除新增行、恢复已删除行或只重置部分字段。单字段校验、滚动等未封装能力仍可通过原生 Form Ref 使用：

```ts
formTableRef.value
  ?.getFormRef()
  ?.validateField?.('tableData.0.phone')
```

行增删、复制、移动由调用方直接维护 `tableData`。
