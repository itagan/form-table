# 事件与 Ref

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
| Element Table 原生事件 | Element UI 原始事件参数 | 否 |

```ts
function handleFieldChange({ row, index, fieldKey, value, previousValue }) {
  console.log('数据变化', row, index, fieldKey, previousValue, value)
}
```

## Slot 上下文

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

行增删、复制、移动由调用方直接维护 `tableData`。
