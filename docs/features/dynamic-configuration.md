# 动态显隐与配置更新

> 可运行 Demo：[字段 Slot 与动态显隐 ↗](http://localhost:5173/dynamic-slot-test) · [行列操作 ↗](http://localhost:5173/row-column-operations)

Column、Item 和字段组件属性都支持根据当前上下文动态计算。配置结构本身由父组件维护，增删、排序或整体变化时应替换 `columns`。

## 动态显隐

```ts
const columns: ColumnConfig[] = [{
  key: 'extra-column',
  label: '补充信息',
  visible: ({ tableData }) => tableData.some(row => row.showExtra),
  children: [{
    key: 'detail-field',
    fieldKey: 'detail',
    type: 'textarea',
    visible: ({ row }) => row.showExtra === true,
    component: {
      props: ({ row }) => ({ disabled: row.detailType === 'none' })
    }
  }]
}]
```

| 层级 | 完整配置路径 | 影响范围 | 上下文 |
| --- | --- | --- | --- |
| Column | `columns[].visible` | 整列 | `tableData, columnConfig` |
| Row props | `columns[].rowProps` | 当前单元格内唯一 Flex Row | ColumnContext + `row, index` |
| Item | `columns[].children[].visible` | 当前字段和 `el-col` | RowContext + `fieldKey, value, itemConfig` |

隐藏只影响渲染，不会自动删除 `tableData` 中的字段值。需要清空值时，在业务事件中显式更新。

## 动态 props 和 options

```ts
{
  fieldKey: 'city',
  type: 'select',
  colProps: ({ index }) => ({ span: index === 0 ? 12 : 8 }),
  formItemProps: ({ row }) => ({ label: row.cityLabel || '城市' }),
  component: {
    props: ({ row }) => ({ disabled: row.locked }),
    options: ({ row }) => cityOptions[row.province] || []
  }
}
```

动态回调在渲染时执行，应保持同步、无副作用。不要在回调中请求接口、修改 row 或创建新的组件定义。

## 页面控制列显隐

如果显隐状态不是行数据的一部分，可以由页面生成新配置：

```ts
const showCost = ref(true)

const columns = computed<ColumnConfig[]>(() => [
  baseColumn,
  ...(showCost.value ? [costColumn] : [])
])
```

也可以保留列并使用闭包状态：

```ts
const costColumn: ColumnConfig = {
  key: 'cost-column',
  label: '费用',
  visible: () => showCost.value,
  children: costItems
}
```

前者适合真正增删配置，后者适合简单显隐。两种方式都应提供稳定 `column.key`。

## 修改字段配置

不要直接修改回调上下文中的 `columnConfig/itemConfig`。由父组件不可变替换 columns：

```ts
function setItemDisabled(item, disabled) {
  const originalProps = item.component?.props

  return {
    ...item,
    component: {
      ...item.component,
      props: context => ({
        ...(typeof originalProps === 'function'
          ? originalProps(context)
          : originalProps),
        disabled
      })
    }
  }
}

function disableField(targetKey, disabled) {
  columns.value = columns.value.map(column => {
    if (!column.children) return column

    return {
      ...column,
      children: column.children.map(item =>
        item.key === targetKey ? setItemDisabled(item, disabled) : item
      )
    }
  })
}
```

实际项目可以封装专用映射函数，避免每个页面重复递归。

## 动态结构与 key

配置结构会增删、排序或前方节点会显隐时，提供稳定身份：

```text
columns[].key
columns[].children[].key
```

`fieldKey` 负责数据路径，不等于渲染身份。重复字段、同一字段切换渲染器或动态布局时尤其需要 Item key。详见[稳定身份与异步安全](./stable-identity.md)。

## 常见错误

- 在 `visible` 中清空字段：渲染期间产生副作用，容易触发重复更新。
- 直接修改 `itemConfig.component.props`：破坏调用方配置的单向数据流。
- 用数组下标作为动态列 key：插入或排序后会复用错误身份。
- 在 `resolveRenderer` 中动态 import Promise：解析器只支持同步组件结果。

## 相关 API

[Column / Item](../api/columns.md) · [Component 配置](../api/component.md) · [Slot 与上下文](../api/contexts.md)
