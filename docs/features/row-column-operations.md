# 行列操作与异步提交

> 可运行 Demo：[打开行列操作与异步提交调试页 ↗](http://localhost:5173/row-column-operations)

FormTable 负责渲染、字段校验路径和当前行字段更新；`tableData` 与 `columns` 始终由调用方维护。因此，行增删、列调整和需要业务确认的变更都应在页面层完成。

需要直接复制“操作列 + 末尾新增 + 当前行后插入 + 复制 + 删除”的完整代码时，先看[常见操作列与行增删](./common-row-actions.md)。本页继续说明移动、动态列、确认和异步提交等进阶边界。

## 优化后的行为与边界

| 场景 | 当前行为 | 推荐配置 |
| --- | --- | --- |
| 同步新增、删除、移动行 | 其他行保留对象引用时可继续复用；校验路径会随下标变化 | 更新后 `nextTick`，再调用 `clearValidate()` |
| 异步期间重排、刷新或重建行对象 | 更新助手可在最新数据中重新定位原行；原行已删除则忽略更新 | 提供唯一稳定的 `tableProps.rowKey` |
| 增删、显隐列，或以相同顺序替换配置 | 唯一 key 相同的已有列会复用 Column 包装实例 | 为动态列提供唯一稳定的 `column.key` |
| 调整已有列的相对顺序 | 可见列会有意重新挂载，让 Element UI 按新顺序注册 | 继续使用稳定 `column.key`，业务值存入 `tableData` |
| 动态显隐同一布局行内的字段 | 显式 key 相同的其他 Item 可保持渲染身份 | 为动态字段提供唯一稳定的 `item.key` |
| 延迟保存到后端 | 可以防抖、批量或等待确认后保存 | 本地 `tableData` 仍须立即接收组件更新 |

这里的复用主要针对 FormTable 的 Column/Item 包装实例。Element UI 的表体单元格按可见位置渲染；插入或删除中间列后，右侧发生位移的单元格内容仍可能重新创建。因此，输入值、选中值等业务状态必须以 `tableData` 为准，不能只保存在字段组件内部。

## 常见行操作

### 新增空行

```ts
const addRow = () => {
  tableData.value = [
    ...tableData.value,
    { name: '', phone: '', enabled: true }
  ]
}
```

普通同步新增不要求 `rowKey`。如果新增行会参与异步保存、刷新或深拷贝，可以为它生成稳定的前端行标识。

### 删除行

```ts
const removeRow = (index: number) => {
  tableData.value = tableData.value.filter(
    (_, rowIndex) => rowIndex !== index
  )
  formTableRef.value?.clearValidate()
}
```

Slot 中可以直接使用当前数据下标：

```vue
<template #actions="{ index }">
  <el-button type="text" @click="removeRow(index)">删除</el-button>
</template>
```

### 复制行

```ts
const copyRow = (index: number) => {
  const source = tableData.value[index]
  if (!source) return

  const copy = {
    ...source,
    id: undefined
  }

  tableData.value = [
    ...tableData.value.slice(0, index + 1),
    copy,
    ...tableData.value.slice(index + 1)
  ]
}
```

如果使用前端 `_rowKey`，复制行必须生成新 key，不能沿用源行身份：

```ts
const copy = {
  ...source,
  id: undefined,
  _rowKey: `client:${crypto.randomUUID()}`
}
```

### 上移和下移

```ts
const moveRow = (from: number, to: number) => {
  if (to < 0 || to >= tableData.value.length) return

  const next = [...tableData.value]
  const [row] = next.splice(from, 1)
  next.splice(to, 0, row)
  tableData.value = next
}
```

这类排序保留了原行对象引用，普通同步场景不需要额外配置 `rowKey`。

Element UI 的表单校验路径包含数组下标。删除、插入、复制或移动行后，下标可能改变，应在 DOM 更新后清理旧校验状态：

```ts
tableData.value = nextRows
await nextTick()
formTableRef.value?.clearValidate()
```

如果页面另外维护了按行保存的草稿、loading 或错误信息，应使用稳定行标识同步删除无效状态；行移动时只调整数据顺序，不要把仍有效的草稿改成按新下标存储。

### 批量修改

跨行更新由调用方直接维护完整数据：

```ts
const enableAll = () => {
  tableData.value = tableData.value.map(row => ({
    ...row,
    enabled: true
  }))
}
```

当前行多个字段更新使用 listener 或 Slot 的 `updateRow`：

```ts
updateRow({
  province: 'zhejiang',
  city: 'hangzhou',
  touched: true
})
```

## 常见列和配置操作

### 根据业务状态隐藏列

仅与业务状态有关的显隐可以直接使用动态 `visible`：

```ts
const columns: ColumnConfig[] = [{
  key: 'audit-column',
  label: '审核信息',
  visible: () => pageMode.value === 'audit',
  children: []
}]
```

如果状态来自组件外部，使用闭包或 Store 即可，不需要把它加入 FormTable 上下文。

### 用户主动切换列

```ts
const hiddenColumnKeys = ref<string[]>([])

const displayColumns = computed(() => {
  return columns.value.filter(column => {
    return !hiddenColumnKeys.value.includes(column.key || '')
  })
})
```

```vue
<FormTable
  v-model="tableData"
  :columns="displayColumns"
/>
```

### 增加、删除和移动列

```ts
const addColumn = (column: ColumnConfig) => {
  columns.value = [...columns.value, column]
}

const removeColumn = (columnKey: string) => {
  columns.value = columns.value.filter(
    column => column.key !== columnKey
  )
}

const moveColumn = (from: number, to: number) => {
  const next = [...columns.value]
  const [column] = next.splice(from, 1)
  next.splice(to, 0, column)
  columns.value = next
}
```

动态列应提供唯一稳定的 `column.key`，不要依赖可能变化的 `label` 或数组下标。同 key、同相对顺序的列在增删、显隐和配置对象替换时会尽量复用列包装实例；真正移动已有列时会重新挂载可见列，让 Element UI 按新顺序注册。

例如列从 `a, b, c` 变为 `a, c` 时，`a`、`c` 的 Column 包装身份保持稳定；但 `c` 在表体中的可见位置发生变化，其单元格内容仍可能由 Element UI 重新创建。如果列从 `a, b, c` 变为 `c, a, b`，已有列的相对顺序发生变化，FormTable 会主动重新挂载全部可见列以保证最终顺序正确。

缺失或重复的 `column.key` 会降级为包含原始下标的内部身份；结构变化后不保证复用。`column.key` 只负责渲染身份，不会写入业务数据，也不要求与 `tableProps.rowKey` 相同。

### 修改某个字段配置

配置上下文是只读引用。需要修改字段配置时，按稳定 `item.key` 在外部不可变替换：

```ts
const updateItemConfig = (
  itemKey: string,
  updater: (item: FormItemConfig) => FormItemConfig
) => {
  columns.value = columns.value.map(column => {
    if (!column.children) return column // cellSlot 列没有字段配置
    return {
      ...column,
      children: column.children.map(rowConfig => ({
        ...rowConfig,
        children: rowConfig.children.map(item => {
          return item.key === itemKey ? updater(item) : item
        })
      }))
    }
  })
}
```

```ts
updateItemConfig('city-field', item => ({
  ...item,
  visible: false
}))
```

不要在 `visible/props` 等渲染回调中直接修改 `columnConfig/rowConfig/itemConfig`。

## 先处理逻辑，再变更字段

内置类型和 `type: 'component'` 默认使用 `v-model`，组件发出输入事件后会立即更新 `tableData`。如果字段必须经过确认、校验或接口处理后才能提交，不应直接使用即时 `v-model` 写入。

“延迟提交”指延迟产生最终业务变更或延迟保存到后端，不是延迟接收 FormTable 已发出的受控数据。只要收到了 `update:tableData`，父组件就应同步更新本地状态：

```vue
<FormTable
  v-model="tableData"
  :columns="columns"
  @update:tableData="tableData = $event"
/>
```

不要对这个回写处理做防抖或等待接口成功。FormTable 只在同一同步调用链内保留连续更新的临时基线；进入下一微任务后会重新以父组件传回的 `tableData` 为准。延迟回写可能让连续输入或跨字段更新基于旧数据计算，覆盖前一次结果。需要减少接口请求时，应立即更新本地 `tableData`，再单独防抖或批量保存其快照。

推荐使用 Slot 或只发出 `commit` 事件的自定义组件：

```ts
{
  key: 'score-field',
  fieldKey: 'score',
  type: 'slot',
  component: {
    renderer: 'score-editor',
    listeners: {
      async commit({ row, setValue }, draftValue) {
        await confirmScore(row, draftValue)
        const result = await saveScore(row.id, draftValue)

        // 只有确认和保存成功后才修改 FormTable 数据。
        setValue(result.score)
      }
    }
  }
}
```

```vue
<template #score-editor="{ value, component }">
  <ScoreEditor
    :value="value"
    v-bind="component.props"
    v-on="component.listeners"
  />
</template>
```

`ScoreEditor` 在内部维护草稿，只在用户点击确认时执行：

```ts
this.$emit('commit', this.draftValue)
```

不要同时绑定：

```vue
<!-- 这会在输入时立即修改 tableData，不属于延迟提交。 -->
<ScoreEditor
  :value="value"
  @input="setValue"
  @commit="confirmAndSave"
/>
```

## 确认后删除行

```ts
const removeAfterConfirm = async (row, index) => {
  await MessageBox.confirm(`确认删除 ${row.name}？`, '提示')

  if (row.id) {
    await deleteContact(row.id)
  }

  // 确认和接口都成功后才修改表格。
  tableData.value = tableData.value.filter(
    (_, rowIndex) => rowIndex !== index
  )
}
```

如果确认期间允许用户移动行，不要继续使用旧 `index` 删除，应使用稳定业务身份：

```ts
tableData.value = tableData.value.filter(
  current => current._rowKey !== row._rowKey
)
```

## 校验通过后新增行

```ts
const addAfterValidate = async () => {
  const valid = await formTableRef.value?.validate()
  if (!valid) return

  const allowed = await checkCanAddRow(tableData.value)
  if (!allowed) return

  tableData.value = [
    ...tableData.value,
    { name: '', phone: '' }
  ]
}
```

## 一次提交多个字段

复杂逻辑完成后，使用一次 `updateRow` 提交最终结果：

```ts
async commit({ row, updateRow }, draft) {
  const normalized = normalizeAddress(draft)
  const result = await validateAddress(normalized)

  if (!result.valid) return

  updateRow({
    province: result.province,
    city: result.city,
    detail: result.detail,
    addressChecked: true
  })
}
```

这样只提交最终业务状态，不会把中间草稿逐步写入 `tableData`。

## 防止异步结果乱序

同一字段允许连续提交时，旧请求可能晚于新请求返回。可以用 `rowKey + fieldKey` 保存请求序号，只让最后一次请求提交结果：

```ts
const requestVersions = new Map<string, number>()

async function commit({ row, fieldKey, setValue }, draftValue) {
  const requestKey = `${row._rowKey}:${fieldKey}`
  const version = (requestVersions.get(requestKey) || 0) + 1
  requestVersions.set(requestKey, version)

  const result = await saveScore(row.id, draftValue)

  if (requestVersions.get(requestKey) !== version) return
  setValue(result.score)
}
```

业务不允许重复提交时，更简单的方式是在请求期间禁用当前行按钮，并在 listener 入口再次检查锁，不能只依赖按钮样式：

```ts
if (savingRowKeys.has(row._rowKey)) return
savingRowKeys.add(row._rowKey)
try {
  const result = await saveRow(row)
  updateRow(result)
} finally {
  savingRowKeys.delete(row._rowKey)
}
```

请求接口支持取消时，可以为每个字段保留一个 `AbortController`：

```ts
const controllers = new Map<string, AbortController>()

async function commit({ row, fieldKey, setValue }, draftValue) {
  const requestKey = `${row._rowKey}:${fieldKey}`
  controllers.get(requestKey)?.abort()

  const controller = new AbortController()
  controllers.set(requestKey, controller)
  try {
    const result = await saveScore(draftValue, { signal: controller.signal })
    if (controllers.get(requestKey) === controller) setValue(result.score)
  } finally {
    if (controllers.get(requestKey) === controller) controllers.delete(requestKey)
  }
}
```

这些并发状态属于请求策略，应保留在页面或业务 Store 中。FormTable 只负责在最终调用更新助手时安全定位数据行。

## 异步保存与行身份

普通同步增删行不要求 `rowKey`。如果 `await` 期间可能刷新、克隆、排序或替换全部行对象，应配置稳定身份：

```vue
<FormTable
  :table-data="tableData"
  :columns="columns"
  :table-props="{ rowKey: '_rowKey' }"
/>
```

更新助手会在最新 `tableData` 中重新定位原数据行；目标行已删除时忽略更新，不会误写其他行。

## 选择更新方式

| 需求 | 推荐方式 |
| --- | --- |
| 普通字段输入 | 内置 type 或 `type: 'component'` 的即时 `v-model` |
| 当前行同步联动 | `component.listeners` + `setValue/updateRow` |
| 确认、校验或请求成功后提交字段 | Slot/custom component 发出 `commit`，完成逻辑后调用更新助手 |
| 增删、复制、移动行 | 调用方替换 `tableData` |
| 增删、排序、隐藏列 | 调用方替换或派生 `columns` |
| 修改字段配置 | 根据稳定配置 key 不可变更新 `columns` |
| 异步期间可能重建行对象 | 配置稳定 `tableProps.rowKey` |
| 降低后端保存频率 | 立即回写本地 `tableData`，单独防抖或批量调用接口 |
