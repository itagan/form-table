# 稳定身份与异步安全

> 可运行 Demo：[异步 cellSlot 更新 ↗](http://localhost:5173/cell-slot) · [动态行列操作 ↗](http://localhost:5173/row-column-operations)

FormTable 中有三类独立身份：业务数据行、Column 配置和 Item 配置。它们解决的问题不同，不能互相替代。

## 身份配置

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  :table-props="{ rowKey: 'id' }"
/>
```

```ts
const columns: ColumnConfig[] = [{
  key: 'contact-column',
  label: '联系人',
  children: [{
    key: 'primary-row',
    children: [{
      key: 'contact-name-field',
      fieldKey: 'name',
      type: 'input'
    }]
  }]
}]
```

| 配置 | 标识对象 | 主要作用 |
| --- | --- | --- |
| `tableProps.rowKey` | 业务数据行 | 异步后定位原行，也供 Element Table 的选择、树形数据等能力使用 |
| `columns[].key` | 列配置 | 动态增删、显隐和替换时保持列包装身份 |
| `columns[].children[].key` | 单元格 Row 布局 | 动态布局行增删或排序时保持身份 |
| `columns[].children[].children[].key` | Item 字段配置 | 动态字段、重复 fieldKey 或渲染器切换时保持身份 |

所有 key 都应在各自作用域内唯一、稳定，不使用当前数组下标。

## 什么时候需要 rowKey

| 场景 | 是否需要 |
| --- | --- |
| 普通同步输入 | 不需要 |
| 同步增删、排序，并保留原行对象引用 | 通常不需要 |
| 异步期间只排序，但仍保留对象引用 | 通常不需要 |
| 异步期间会深拷贝、接口刷新或替换全部行对象 | 建议配置 |
| Element Table 需要保留选择或树节点身份 | 按 Element UI 要求配置 |

不要仅为了新增空行而强制生成无业务意义的随机 key；但一旦配置 rowKey，它必须在表内唯一且长期稳定。

## 异步更新示例

```ts
component: {
  listeners: {
    async change({ row, index, setValue }, nextValue) {
      console.log('触发时位置', row.id, index)
      await saveValue(row.id, nextValue)

      // 等待期间即使重新排序或接口刷新，也按 row.id 定位。
      setValue(nextValue)
    }
  }
}
```

`row/index/value` 是触发时快照。更新助手绑定原行身份，并在实际调用时基于父组件最新回写的 `tableData` 计算：

- 找到唯一 rowKey：更新最新位置上的原行。
- 目标已删除：忽略更新。
- rowKey 缺失或重复：忽略更新，避免误写其他行。
- 未配置 rowKey：尝试按原对象引用定位。

## column.key 与 Element Table

动态列增删、显隐和同顺序替换时，稳定 `column.key` 可以复用仍存在的列包装实例。已有列真实重排时，FormTable 会重新挂载可见列以同步 Element UI 的列注册顺序。

Element Table 的表体单元格仍按位置渲染。插入或删除中间列时，发生位置移动的单元格内容可能重新创建，因此未提交状态不应只保存在字段组件内部，应及时同步到 `tableData`。

## item.key 与 fieldKey

```text
fieldKey → 读取、写入和校验的数据路径
item.key → Vue 渲染身份
```

简单静态布局可以省略 Item key，FormTable 会使用 fieldKey 等信息降级生成身份。以下情况建议显式提供：

- 同一 Row 内重复使用相同 fieldKey。
- Item 会动态增删或排序。
- 前方 Item 会显隐，后续字段不应重新挂载。
- 同一字段在不同展示/编辑组件之间切换。

## 常见错误

- `rowKey: row => tableData.value.indexOf(row)`：排序或插入后身份变化。
- 每次 computed 重新生成随机 key：每次渲染都被视为新节点。
- 认为 `fieldKey` 总能替代 Item key：重复字段和动态布局中不成立。
- 异步结束后执行 `tableData[index] = ...`：旧 index 可能对应其他行。
